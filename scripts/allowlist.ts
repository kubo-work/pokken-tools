/**
 * allowed_emails テーブル（管理画面ログインの allowlist）を CLI から操作するスクリプト。
 *
 * 使い方:
 *   bun scripts/allowlist.ts list --local            # ローカル D1 の登録一覧
 *   bun scripts/allowlist.ts list --remote           # 本番 D1 の登録一覧
 *   bun scripts/allowlist.ts add foo@example.com --local
 *   bun scripts/allowlist.ts add foo@example.com --remote
 *
 * 内部で wrangler d1 execute を呼ぶ。wrangler が認証済みである必要がある。
 */
import { spawnSync } from "node:child_process";

const BINDING = "DB";

type Target = "--local" | "--remote";
type Subcommand = "list" | "add";

type ParsedArguments = {
  subcommand: Subcommand;
  target: Target;
  email: string | null;
};

const USAGE = [
  "Usage:",
  "  bun scripts/allowlist.ts list --local | --remote",
  "  bun scripts/allowlist.ts add <email> --local | --remote",
].join("\n");

function exitWithUsage(message: string): never {
  console.error(message);
  console.error(USAGE);
  process.exit(1);
}

function parseArguments(): ParsedArguments {
  const args = process.argv.slice(2);

  const subcommand = args.find((arg) => arg === "list" || arg === "add") as
    | Subcommand
    | undefined;
  const target = args.find((arg) => arg === "--local" || arg === "--remote") as
    | Target
    | undefined;
  const email = args.find((arg) => !arg.startsWith("--") && arg !== subcommand) ?? null;

  if (!subcommand) {
    exitWithUsage("Error: subcommand must be 'list' or 'add'.");
  }
  if (!target) {
    exitWithUsage("Error: target must be '--local' or '--remote'.");
  }
  if (subcommand === "add" && !email) {
    exitWithUsage("Error: 'add' requires an email address.");
  }

  return { subcommand, target, email };
}

// 簡易バリデーション。allowlist 用途なので最低限の形式チェックのみ行う。
function assertValidEmail(email: string): void {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    exitWithUsage(`Error: '${email}' is not a valid email address.`);
  }
}

// SQL リテラル中のシングルクォートを 2 個にしてエスケープする。
function toSqlStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function executeSql(target: Target, sql: string): void {
  const result = spawnSync(
    "bunx",
    ["wrangler", "d1", "execute", BINDING, target, "--command", sql],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error("wrangler d1 execute failed.");
  }
}

function main(): void {
  const { subcommand, target, email } = parseArguments();

  if (subcommand === "list") {
    executeSql(
      target,
      "SELECT email, created_at FROM allowed_emails ORDER BY created_at DESC;",
    );
    return;
  }

  // subcommand === "add"
  assertValidEmail(email!);
  const emailLiteral = toSqlStringLiteral(email!);
  console.log(`[allowlist] add ${email} -> ${target.slice(2)}`);
  executeSql(
    target,
    `INSERT INTO allowed_emails (email) VALUES (${emailLiteral}) ON CONFLICT (email) DO NOTHING;`,
  );
}

main();
