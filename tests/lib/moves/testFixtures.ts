import type { Move } from "@/types/move";

/**
 * グルーピング・検索系のテストで使う最小の有効な技。
 * 攻撃属性やダメージ等は対象外のロジックなので持たせない。
 */
export const makeMove = (overrides: Partial<Move> & { id: string }): Move => ({
  name: overrides.id,
  command: "Y",
  guardLevel: null,
  startup: 10,
  guardFrameAdvantage: -5,
  ...overrides,
});
