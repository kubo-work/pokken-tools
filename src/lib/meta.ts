import type {
  GuardLevel,
  Move,
  MoveAttackType,
  MoveCategory,
  MoveVariant,
  Phase,
  ResonanceFlinch,
  ResonanceFlinchLevel,
  ResonanceState,
  SpecialAttribute,
  StrengthRange,
} from "@/types/move";

export const CATEGORY_META: Record<
  MoveCategory,
  { label: string; shortLabel: string; color: string }
> = {
  attack: { label: "通常攻撃", shortLabel: "攻", color: "#ef4444" },
  block: { label: "ブロック", shortLabel: "ブ", color: "#3b82f6" },
  grab: { label: "つかみ", shortLabel: "つ", color: "#22c55e" },
};

export const ATTACK_TYPE_META: Record<
  MoveAttackType,
  { label: string; shortLabel: string }
> = {
  strike: { label: "打撃", shortLabel: "打" },
  projectile: { label: "弾", shortLabel: "弾" },
};

export const SPECIAL_ATTRIBUTE_META: Record<
  SpecialAttribute,
  { label: string; shortLabel: string }
> = {
  blockPiercing: { label: "ブロック貫通", shortLabel: "貫" },
  armor: { label: "アーマー", shortLabel: "鎧" },
};

export const MOVE_VARIANT_META: Record<
  MoveVariant,
  { label: string; shortLabel: string }
> = {
  normal: { label: "通常", shortLabel: "" },
  charge: { label: "ため", shortLabel: "た" },
  derivative: { label: "派生", shortLabel: "派" },
};

/** 最大ため段階の表示ラベル。 */
const CHARGE_MAX_LABEL = "ためMAX";

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

/**
 * ため段階の表示ラベルを返す。
 * - 段階が単一（maxLevel<=1）または未設定なら単に「ため」
 * - 最大段階なら「ためMAX」
 * - それ以外は「ため{段階}」（例: ため2）
 */
export const chargeStageLabel = (
  level: number | undefined,
  maxLevel: number,
): string => {
  if (maxLevel <= 1 || level === undefined) {
    return MOVE_VARIANT_META.charge.label;
  }
  if (level >= maxLevel) {
    return CHARGE_MAX_LABEL;
  }
  return `${MOVE_VARIANT_META.charge.label}${level}`;
};

/**
 * 子技（ため/派生）の表示ラベルを返す。通常技や variant 未設定は undefined。
 * ため技は段階に応じて「ため」「ため2」「ためMAX」を返す。
 * chargeMaxLevel は同じ親グループ内のため段階の最大値（maxChargeLevel で算出）。
 */
export const childVariantLabel = (
  move: Move,
  chargeMaxLevel: number,
): string | undefined => {
  if (move.variant === "charge") {
    return chargeStageLabel(move.chargeLevel, chargeMaxLevel);
  }
  if (move.variant === "derivative") {
    return MOVE_VARIANT_META.derivative.label;
  }
  return undefined;
};

/**
 * 攻撃属性ごとの強度の入力可能範囲。打撃は 1〜6、弾は 1〜8。
 * 攻撃属性を持たない「つかみ」技は強度を持たないため、ここには含めない。
 */
export const STRENGTH_RANGE_BY_ATTACK_TYPE: Record<
  MoveAttackType,
  StrengthRange
> = {
  strike: { min: 1, max: 6 },
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
 * resonanceOnly（共鳴中のみ存在する技）に付けるラベル。
 * 省スペースの一覧では short、詳細ページでは full を使う。
 */
export const RESONANCE_ONLY_LABEL = { short: "共鳴", full: "共鳴専用" } as const;

export const RESONANCE_FLINCH_META: Record<
  ResonanceFlinchLevel,
  { label: string }
> = {
  weak: { label: "弱" },
  strong: { label: "強" },
};

/**
 * 共鳴怯ませ強度の表示ラベルを返す。
 * - 未設定（つかみ等）→ "-"
 * - 常時一定 → "弱" / "強"
 * - 出始め弱→途中強 → "弱→強（持続{N}〜）"
 */
export const resonanceFlinchLabel = (
  value: ResonanceFlinch | undefined,
): string => {
  if (value === undefined) {
    return "-";
  }
  if (value === "weak" || value === "strong") {
    return RESONANCE_FLINCH_META[value].label;
  }
  return `${RESONANCE_FLINCH_META.weak.label}→${RESONANCE_FLINCH_META.strong.label}（持続${value.switchActiveFrame}〜）`;
};

export const GUARD_LEVEL_META: Record<
  GuardLevel,
  { label: string; shortLabel: string }
> = {
  high: { label: "上段", shortLabel: "上" },
  mid_high: { label: "中上段", shortLabel: "中上" },
  mid: { label: "通常中段", shortLabel: "中" },
  special_mid: { label: "特殊中段", shortLabel: "特中" },
  mid_low: { label: "中下段", shortLabel: "中下" },
  low: { label: "下段", shortLabel: "下" },
};

export const PHASE_META: Record<Phase, { label: string; shortLabel: string }> = {
  field: { label: "フィールドフェイズ", shortLabel: "FP" },
  duel: { label: "デュエルフェイズ", shortLabel: "DP" },
};

export const RESONANCE_META: Record<ResonanceState, { label: string }> = {
  normal: { label: "通常" },
  resonance: { label: "共鳴" },
};

export const MOVE_CATEGORIES: MoveCategory[] = ["attack", "block", "grab"];
export const MOVE_ATTACK_TYPES: MoveAttackType[] = ["strike", "projectile"];
export const RESONANCE_FLINCH_LEVELS: ResonanceFlinchLevel[] = [
  "weak",
  "strong",
];
export const MOVE_SPECIAL_ATTRIBUTES: SpecialAttribute[] = [
  "blockPiercing",
  "armor",
];
export const GUARD_LEVELS: GuardLevel[] = [
  "high",
  "mid_high",
  "mid",
  "special_mid",
  "mid_low",
  "low",
];
export const PHASES: Phase[] = ["duel", "field"];
export const MOVE_VARIANTS: MoveVariant[] = ["normal", "charge", "derivative"];
/** ため/派生など、親技にぶら下がる variant。 */
export const CHILD_MOVE_VARIANTS: Exclude<MoveVariant, "normal">[] = [
  "charge",
  "derivative",
];
