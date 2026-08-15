import type {
  DamageValue,
  HitBreakdownEntry,
  Move,
  MoveAttackType,
  ProjectileStrengthSymbol,
  StrengthRange,
  StrengthValue,
} from "@/types/move";
import {
  HIT_BREAKDOWN_NUMERIC_KEYS,
  PROJECTILE_STRENGTH_SYMBOLS,
  type HitBreakdownCategoricalKey,
  type HitBreakdownNumericKey,
} from "./moveEnums";

/**
 * 技の値そのものに対する判断。表示を一切伴わないゲーム仕様側のルールで、
 * 画面が無くても成立する。ラベルや表示文字列は moveLabels / moveFormat に置く。
 */

/**
 * 多段ヒットとみなす最小ヒット数。「DamageValue の多段表記 (perHit×hitCount) が要求する
 * ヒット数」と「合計ダメージ (totalDamage) を設定できる条件」は同じ“多段”の判断なので、
 * スキーマ・ドメイン判定の双方がこの 1 つを参照する。
 */
export const MULTI_HIT_MIN_COUNT = 2;

/**
 * 攻撃属性ごとの強度の数値の入力可能範囲。打撃は 1〜8、弾は 1〜9。
 * 攻撃属性を持たない「つかみ」技は強度を持たないため、ここには含めない。
 */
export const STRENGTH_RANGE_BY_ATTACK_TYPE: Record<
  MoveAttackType,
  StrengthRange
> = {
  strike: { min: 1, max: 8 },
  projectile: { min: 1, max: 9 },
};

/**
 * 攻撃属性ごとに許容される強度の記号。◎ / ● は弾同士の干渉を表す概念のため打撃には無い。
 */
export const STRENGTH_SYMBOLS_BY_ATTACK_TYPE: Record<
  MoveAttackType,
  readonly ProjectileStrengthSymbol[]
> = {
  strike: [],
  projectile: PROJECTILE_STRENGTH_SYMBOLS,
};

/** 強度が記号か数値か。両者で扱いが分かれる箇所はすべてこれを通す。 */
export const isStrengthSymbol = (
  value: StrengthValue,
): value is ProjectileStrengthSymbol => typeof value === "string";

/** 指定した攻撃属性で選べる記号。攻撃属性が未設定（つかみ等）なら空。 */
export const strengthSymbolsForAttackType = (
  attackType: MoveAttackType | undefined,
): readonly ProjectileStrengthSymbol[] =>
  attackType === undefined ? [] : STRENGTH_SYMBOLS_BY_ATTACK_TYPE[attackType];

/**
 * その攻撃属性でその強度が許されるか。数値は範囲内の整数、記号はその属性が持つものだけ。
 * スキーマ検証・入力候補の生成・攻撃属性変更時のクリア判定が同じ基準を使うための唯一の述語。
 */
export const isStrengthAllowedFor = (
  value: StrengthValue,
  attackType: MoveAttackType,
): boolean => {
  if (isStrengthSymbol(value)) {
    return STRENGTH_SYMBOLS_BY_ATTACK_TYPE[attackType].includes(value);
  }
  const range = STRENGTH_RANGE_BY_ATTACK_TYPE[attackType];
  return Number.isInteger(value) && value >= range.min && value <= range.max;
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

/** 数値項目の単一値を持ちうる上書き層の差分。打ち消し判定に必要な項目だけを見る。 */
type NumericValueOverride = Partial<Record<HitBreakdownNumericKey, unknown>>;

/**
 * 上書き層の単一値が、それより前の層のヒット内訳を打ち消すか。
 *
 * 内訳と同じ項目を単一値で定義すると、その状態では内訳が丸ごと効かなくなる
 * （resolveMove の applyOverrideLayer）。落とす側と、落ちることを前提に表示を組み立てる側
 * （fieldPhaseDisplay の DP/FP セル結合）で判断が食い違うと、消えたはずの内訳の値を
 * 結合セルに出してしまうため、判定をここに集約する。
 */
export const isHitBreakdownShadowedBy = (
  override: NumericValueOverride | undefined,
  hitBreakdown: HitBreakdownEntry[] | undefined,
): boolean =>
  HIT_BREAKDOWN_NUMERIC_KEYS.some(
    (key) =>
      override?.[key] !== undefined && hitBreakdownDefines(hitBreakdown, key),
  );

/**
 * ヒット内訳グループの総ヒット数（技全体のヒット数）。
 * グループは技の連続ヒットを漏れなく分割したものなので、値を定義していないグループも数える
 * （合計ダメージが多段ヒット技にのみ設定できるかの判定 (totalDamageRefinements) で使う）。
 */
export const hitBreakdownTotalHitCount = (entries: HitBreakdownEntry[]): number =>
  entries.reduce((sum, entry) => sum + entry.hitCount, 0);

/**
 * ダメージ系の値が表すヒット数。単一値（number）は1、多段表記は hitCount、未設定は0。
 * hitBreakdownTotalHitCount と同じ用途で、内訳を持たない技のヒット数判定に使う。
 */
export const damageValueHitCount = (value: DamageValue | undefined): number => {
  if (value === undefined) {
    return 0;
  }
  return typeof value === "number" ? 1 : value.hitCount;
};

/**
 * 基礎ダメージが表すヒット数。ヒット内訳を持つ技は内訳の総ヒット数、持たない技は
 * 単一値（perHit×hitCount / 単発）のヒット数。
 *
 * 「合計ダメージ（totalDamage）を持てるか」を判断する箇所（スキーマ検証・状態解決・
 * 管理画面の入力欄表示）が同じ数え方を共有するための 1 箇所。数え方が分かれると、
 * 入力できるのに保存できない（またはその逆）状態が生まれる。
 */
export const baseDamageHitCount = (
  baseDamage: DamageValue | undefined,
  hitBreakdown: HitBreakdownEntry[] | undefined,
): number =>
  hitBreakdown !== undefined
    ? hitBreakdownTotalHitCount(hitBreakdown)
    : damageValueHitCount(baseDamage);

/**
 * 基礎ダメージが多段ヒット（総ヒット数2以上）か。合計ダメージ（totalDamage）を
 * 持てる条件そのもので、スキーマ検証・状態解決・管理画面の入力欄表示が共通して使う。
 */
export const isBaseDamageMultiHit = (
  baseDamage: DamageValue | undefined,
  hitBreakdown: HitBreakdownEntry[] | undefined,
): boolean => baseDamageHitCount(baseDamage, hitBreakdown) >= MULTI_HIT_MIN_COUNT;
