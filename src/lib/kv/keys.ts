/**
 * KV キー設計。
 *
 * - `character:{id}`  キャラ単体（Character JSON）
 * - `exceptions`       例外配列（PunishException[]）
 *
 * 一覧表示は registry.ts の固定リストから ID を取り、必要なキャラだけ get する。
 * KV の list() はコスト・整合性の観点で使わない。
 */
export const KV_KEYS = {
  character: (id: string) => `character:${id}`,
  exceptions: "exceptions",
} as const;
