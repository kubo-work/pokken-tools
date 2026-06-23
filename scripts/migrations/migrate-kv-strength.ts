/**
 * KV 上の技データを「強度の数値化」スキーマへ現地変換する移行スクリプト（Issue #31）。
 *
 * 変換内容:
 *   - 攻撃技/ブロック技: strength を文字列 (weak/medium/strong) → 数値 (1/3/5) に変換
 *   - つかみ技 (category==="grab"): strength を削除し、guardLevel を null にする
 *   - resonance.strength も同じ規則で変換／削除
 *
 * 使い方:
 *   bun scripts/migrations/migrate-kv-strength.ts --local              # ローカル KV を変換
 *   bun scripts/migrations/migrate-kv-strength.ts --remote --dry-run   # 本番 KV を変換せず差分プレビュー
 *   bun scripts/migrations/migrate-kv-strength.ts --remote             # 本番 KV を変換
 *
 * 取得・書き戻し・冪等判定・dry-run・集計などの共通処理は ../lib/kv-migrate.ts が担当する。
 * 本ファイルは「1 キャラをどう変換するか」だけを記述する。新しいスキーマ変更は本ファイルを
 * 書き換えず、scripts/migrations/ 配下に runKvMigration を呼ぶ新規スクリプトとして追加すること。
 */
import { runKvMigration } from "../lib/kv-migrate";

/** 旧 3 段階強度から数値への暫定マッピング。 */
const STRENGTH_MAP: Record<string, number> = { weak: 1, medium: 3, strong: 5 };

interface MoveLike {
  category?: string;
  strength?: unknown;
  guardLevel?: unknown;
  resonance?: { strength?: unknown } & Record<string, unknown>;
}

interface CharacterLike {
  fieldMoves?: MoveLike[];
  duelMoves?: MoveLike[];
}

const convertStrength = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value in STRENGTH_MAP) {
    return STRENGTH_MAP[value];
  }
  return undefined;
};

/** 1 つの技を変換する。変更があれば true を返す。 */
const migrateMove = (move: MoveLike): boolean => {
  let changed = false;
  if (move.category === "grab") {
    if (move.strength !== undefined) {
      delete move.strength;
      changed = true;
    }
    if (move.guardLevel !== null) {
      move.guardLevel = null;
      changed = true;
    }
    if (move.resonance?.strength !== undefined) {
      delete move.resonance.strength;
      changed = true;
    }
    return changed;
  }
  if (typeof move.strength === "string") {
    move.strength = convertStrength(move.strength);
    changed = true;
  }
  if (typeof move.resonance?.strength === "string") {
    move.resonance.strength = convertStrength(move.resonance.strength);
    changed = true;
  }
  return changed;
};

const migrateCharacter = (character: unknown): boolean => {
  const { fieldMoves = [], duelMoves = [] } = character as CharacterLike;
  let changed = false;
  for (const moves of [fieldMoves, duelMoves]) {
    for (const move of moves) {
      if (migrateMove(move)) {
        changed = true;
      }
    }
  }
  return changed;
};

runKvMigration({
  name: "migrate-kv-strength",
  binding: "FRAME_DATA_KV",
  migrateCharacter,
});
