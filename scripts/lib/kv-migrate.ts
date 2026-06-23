/**
 * KV 上の技データを「現地変換」するマイグレーションの共通ランナー。
 *
 * 管理画面で入力されたデータは KV にしか存在しないため、data/ からの再シード
 * （seed-kv.ts）では上書き・消失してしまう。スキーマ変更のたびに「KV を取得 →
 * 変換 → 書き戻す」スクリプトを 1 本ずつ書くのが正しい運用だが、引数 parse・
 * wrangler 呼び出し・キャラ走査・冪等判定・dry-run・集計ログは毎回同じになる。
 *
 * 本モジュールはそれらを集約し、各マイグレーションが「1 キャラ分をどう変換するか」
 * だけを書けばよい枠を提供する。新しいスキーマ変更は本ファイルを書き換えるのでは
 * なく、runKvMigration を呼ぶ新規スクリプトを追加すること（D1 の migrations と同じ
 * 発想で、過去のマイグレーションは履歴として残す）。
 *
 * 使い方の例は migrate-kv-strength.ts を参照。
 */
import { spawnSync } from "node:child_process";
import { CHARACTER_IDS } from "../../src/lib/characters/registry";
import { KV_KEYS } from "../../src/lib/kv/keys";

/** wrangler の KV 操作対象。--local はローカル KV、--remote は本番 KV。 */
type Target = "--local" | "--remote";

/**
 * wrangler が「キー不在」を示すときの stderr 断片。これ以外の失敗（認証切れ・
 * 通信障害など）は「未投入」と区別して中断するための判定に使う。
 */
const KEY_NOT_FOUND_PATTERN = /not found|does not exist/i;

export interface KvMigration {
  /** マイグレーションの識別名。ログに出力される。 */
  name: string;
  /** 対象の KV バインディング名。 */
  binding: string;
  /**
   * パース済みの 1 キャラ分のデータを破壊的に変換する。
   * 変更を加えた場合は true、変換不要だった場合は false を返す（冪等性のため）。
   */
  migrateCharacter: (character: unknown) => boolean;
}

const parseArgs = (
  scriptName: string,
): { target: Target; dryRun: boolean } => {
  const args = process.argv.slice(2);
  const target = args.find(
    (arg): arg is Target => arg === "--local" || arg === "--remote",
  );
  if (target === undefined) {
    console.error(`Usage: bun ${scriptName} --local | --remote [--dry-run]`);
    process.exit(1);
  }
  return { target, dryRun: args.includes("--dry-run") };
};

/**
 * KV から値を取得する。キーが存在しなければ undefined。
 * キー不在以外の失敗（認証切れ・通信障害・プロセス起動失敗）は throw して中断する。
 */
const getKv = (
  binding: string,
  target: Target,
  key: string,
): string | undefined => {
  const result = spawnSync(
    "bunx",
    ["wrangler", "kv", "key", "get", "--binding", binding, target, key],
    { encoding: "utf8" },
  );
  if (result.error !== undefined) {
    throw new Error(`Failed to spawn wrangler for KV key "${key}": ${result.error.message}`);
  }
  if (result.status === 0) {
    return result.stdout;
  }
  const stderr = result.stderr ?? "";
  if (KEY_NOT_FOUND_PATTERN.test(stderr)) {
    return undefined;
  }
  throw new Error(
    `Failed to get KV key "${key}" (exit ${result.status}): ${stderr.trim() || "unknown error"}`,
  );
};

const putKv = (
  binding: string,
  target: Target,
  key: string,
  value: string,
): void => {
  const result = spawnSync(
    "bunx",
    ["wrangler", "kv", "key", "put", "--binding", binding, target, key, value],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`Failed to put KV key: ${key}`);
  }
};

/**
 * KV マイグレーションを実行する。引数 parse・取得・変換・書き戻し・集計を担当し、
 * 変換ロジックのみ migration.migrateCharacter に委ねる。
 */
export const runKvMigration = (migration: KvMigration): void => {
  const { target, dryRun } = parseArgs(`scripts/migrations/${migration.name}.ts`);
  let migrated = 0;
  let unchanged = 0;
  let missing = 0;

  console.log(
    `[migration] ${migration.name} (${target.slice(2)}${dryRun ? ", dry-run" : ""})\n`,
  );

  for (const id of CHARACTER_IDS) {
    const key = KV_KEYS.character(id);
    const raw = getKv(migration.binding, target, key);
    if (raw === undefined || raw.trim() === "") {
      missing += 1;
      console.log(`[skip] ${key} (KV 未投入)`);
      continue;
    }
    const character = JSON.parse(raw) as unknown;
    if (!migration.migrateCharacter(character)) {
      unchanged += 1;
      console.log(`[ok]   ${key} (変換不要)`);
      continue;
    }
    migrated += 1;
    if (dryRun) {
      console.log(`[would migrate] ${key}`);
    } else {
      console.log(`[migrate] ${key}`);
      putKv(migration.binding, target, key, JSON.stringify(character, null, 2));
    }
  }

  const verb = dryRun ? "（dry-run）変換対象" : "変換";
  console.log(
    `\n${target.slice(2)} KV: ${verb} ${migrated} 件 / 変換不要 ${unchanged} 件 / 未投入 ${missing} 件`,
  );
};
