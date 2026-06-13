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

// allowlist 用途なので最低限の形式チェックのみ行う。
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const isSubcommand = (arg: string): arg is Subcommand => arg === "list" || arg === "add";
const isTarget = (arg: string): arg is Target => arg === "--local" || arg === "--remote";

const exitWithUsage = (message: string): never => {
  console.error(message);
  console.error(USAGE);
  process.exit(1);
};

const parseArguments = (): ParsedArguments => {
  const args = process.argv.slice(2);

  const subcommand = args.find(isSubcommand);
  const target = args.find(isTarget);
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
};

const assertValidEmail = (email: string): void => {
  if (!EMAIL_PATTERN.test(email)) {
    exitWithUsage(`Error: '${email}' is not a valid email address.`);
  }
};

// SQL リテラル中のシングルクォートを 2 個にしてエスケープする。
const toSqlStringLiteral = (value: string): string => `'${value.replace(/'/g, "''")}'`;

const describeTarget = (target: Target): string =>
  target === "--remote" ? "remote" : "local";

const executeSql = (target: Target, sql: string): void => {
  const result = spawnSync(
    "bunx",
    ["wrangler", "d1", "execute", BINDING, target, "--command", sql],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error("wrangler d1 execute failed.");
  }
};

const main = (): void => {
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
  console.log(`[allowlist] add ${email} -> ${describeTarget(target)}`);
  executeSql(
    target,
    `INSERT INTO allowed_emails (email) VALUES (${emailLiteral}) ON CONFLICT (email) DO NOTHING;`,
  );
};

main();
