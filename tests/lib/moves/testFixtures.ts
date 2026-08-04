import type { HitBreakdownEntry, Move } from "@/types/move";

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

/** 瞑想3段階アシストパワー相当: 1ヒット目50、2〜4ヒット目45×3。 */
export const meditationBreakdown: HitBreakdownEntry[] = [
  { hitCount: 1, baseDamage: 50 },
  { hitCount: 3, baseDamage: 45 },
];

/** サーナイト8Y相当: 1ヒット目60・上段、2〜4ヒット目60×3・空。 */
export const gardevoirBreakdown: HitBreakdownEntry[] = [
  { hitCount: 1, baseDamage: 60, guardLevel: "high" },
  { hitCount: 3, baseDamage: 60, airGroundJudgment: "air" },
];
