import type {
  HitBreakdownEntry,
  Move,
  MoveAttackType,
  StrengthRange,
} from "@/types/move";
import type {
  HitBreakdownCategoricalKey,
  HitBreakdownDamageKey,
  HitBreakdownNumericKey,
} from "./moveEnums";

/**
 * 技の値そのものに対する判断。表示を一切伴わないゲーム仕様側のルールで、
 * 画面が無くても成立する。ラベルや表示文字列は moveLabels / moveFormat に置く。
 */

/**
 * 攻撃属性ごとの強度の入力可能範囲。打撃は 1〜8、弾は 1〜8。
 * 攻撃属性を持たない「つかみ」技は強度を持たないため、ここには含めない。
 */
export const STRENGTH_RANGE_BY_ATTACK_TYPE: Record<
  MoveAttackType,
  StrengthRange
> = {
  strike: { min: 1, max: 8 },
  projectile: { min: 1, max: 8 },
};

/**
 * 指定した攻撃属性で許容される強度範囲を返す。
 * 攻撃属性が未設定（つかみ等）の場合は強度を持たないため undefined。
 */
export const strengthRangeForAttackType = (
  attackType: MoveAttackType | undefined,
): StrengthRange | undefined =>
  attackType === undefined
    ? undefined
    : STRENGTH_RANGE_BY_ATTACK_TYPE[attackType];

/**
 * 同じ親に属する子技群の中で、ため段階の最大値を返す。
 * ため技が無い、または段階未設定なら 0。「ためMAX」の判定基準に使う。
 */
export const maxChargeLevel = (childMoves: Move[]): number =>
  childMoves.reduce(
    (max, child) =>
      child.variant === "charge" && child.chargeLevel !== undefined
        ? Math.max(max, child.chargeLevel)
        : max,
    0,
  );

/** ヒット内訳のいずれかのグループでフィールドが設定されているか。 */
export const hitBreakdownDefines = (
  entries: HitBreakdownEntry[] | undefined,
  key: HitBreakdownNumericKey | HitBreakdownCategoricalKey,
): boolean => entries?.some((entry) => entry[key] !== undefined) ?? false;

/**
 * ヒット内訳のダメージ系フィールドの合計値（一覧テーブル向け）。
 * 各グループは「1ヒットあたりの値 × hitCount」の合計。どのグループにも値が無ければ undefined。
 */
export const totalHitBreakdownDamage = (
  entries: HitBreakdownEntry[],
  key: HitBreakdownDamageKey,
): number | undefined => {
  if (!hitBreakdownDefines(entries, key)) {
    return undefined;
  }
  return entries.reduce(
    (sum, entry) => sum + (entry[key] ?? 0) * entry.hitCount,
    0,
  );
};
