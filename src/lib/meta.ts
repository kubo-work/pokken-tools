import type {
  GuardLevel,
  Move,
  MoveAttackType,
  MoveCategory,
  MoveStrength,
  MoveVariant,
  Phase,
  ResonanceState,
  SpecialAttribute,
} from "@/types/move";

export const CATEGORY_META: Record<
  MoveCategory,
  { label: string; shortLabel: string; color: string }
> = {
  attack: { label: "攻撃", shortLabel: "攻", color: "#ef4444" },
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

export const STRENGTH_META: Record<MoveStrength, { label: string }> = {
  weak: { label: "弱" },
  medium: { label: "中" },
  strong: { label: "強" },
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
export const MOVE_SPECIAL_ATTRIBUTES: SpecialAttribute[] = [
  "blockPiercing",
  "armor",
];
export const MOVE_STRENGTHS: MoveStrength[] = ["weak", "medium", "strong"];
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
