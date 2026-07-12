import type {
  AirGroundJudgment,
  DamageValue,
  GuardLevel,
  HitBreakdownEntry,
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
  projectileNullify: { label: "弾消し", shortLabel: "消" },
};

/**
 * 特殊属性 1 件の表示ラベルを返す。
 * 弾消しは開始フレームが登録されていれば「弾消し（NF〜）」（N は動作開始 1F 目基準）。
 */
export const specialAttributeLabel = (
  attribute: SpecialAttribute,
  move: Move,
): string => {
  const baseLabel = SPECIAL_ATTRIBUTE_META[attribute].label;
  if (
    attribute === "projectileNullify" &&
    move.projectileNullifyStartFrame !== undefined
  ) {
    return `${baseLabel}（${move.projectileNullifyStartFrame}F〜）`;
  }
  return baseLabel;
};

export const AIR_GROUND_JUDGMENT_META: Record<
  AirGroundJudgment,
  { label: string }
> = {
  air: { label: "空" },
  ground: { label: "地" },
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

/**
 * ダメージ系の値の表示ラベル。未計測 (undefined) は「-」、
 * 多段ヒットは「20×3」形式で返す。
 */
export const formatDamageValue = (value: DamageValue | undefined): string => {
  if (value === undefined) {
    return "-";
  }
  if (typeof value === "number") {
    return `${value}`;
  }
  return `${value.perHit}×${value.hitCount}`;
};

/**
 * ヒット内訳のダメージ系フィールド。値は「グループ内の1ヒットあたり」。
 * 相互排他バリデーション（schema.ts）や更新処理（moveUpdaters.ts）でも同じキー集合を
 * 参照するため、配列そのものをここで一元管理し、型もそこから導出する。
 */
export const HIT_BREAKDOWN_DAMAGE_KEYS = [
  "baseDamage",
  "chipDamage",
  "guardCrushValue",
] as const;
export type HitBreakdownDamageKey = (typeof HIT_BREAKDOWN_DAMAGE_KEYS)[number];
/** ヒット内訳系の判定系フィールド。 */
type HitBreakdownCategoricalKey = "guardLevel" | "airGroundJudgment";

/** ヒット内訳のいずれかのグループでフィールドが設定されているか。 */
export const hitBreakdownDefines = (
  entries: HitBreakdownEntry[] | undefined,
  key: HitBreakdownDamageKey | HitBreakdownCategoricalKey,
): boolean => entries?.some((entry) => entry[key] !== undefined) ?? false;

/** 各グループの開始ヒット位置（1始まり）を1回の走査で求める。 */
const hitBreakdownStartPositions = (entries: HitBreakdownEntry[]): number[] => {
  const starts: number[] = [];
  let nextStart = 1;
  for (const entry of entries) {
    starts.push(nextStart);
    nextStart += entry.hitCount;
  }
  return starts;
};

/** 開始位置とヒット数から「1」「2〜4」のようなヒット範囲ラベルを作る。 */
const hitRangeLabel = (start: number, hitCount: number): string => {
  const end = start + hitCount - 1;
  return start === end ? `${start}` : `${start}〜${end}`;
};

/**
 * ヒット内訳のダメージ系フィールドを「50+45×3」形式で表示する。
 * 各グループは formatDamageValue と同じ規約（hitCount>1 なら 値×hitCount）、
 * 未設定グループは「-」。連結は「+」（「/」は択一表記と紛れるため使わない）。
 */
export const formatHitBreakdownDamage = (
  entries: HitBreakdownEntry[],
  key: HitBreakdownDamageKey,
): string =>
  entries
    .map((entry) => {
      const value = entry[key];
      if (value === undefined) {
        return "-";
      }
      return entry.hitCount > 1 ? `${value}×${entry.hitCount}` : `${value}`;
    })
    .join("+");

/** ヒット内訳1グループ分の判定系フィールドの表示ラベル。未設定なら undefined。 */
const hitBreakdownCategoricalEntryLabel = (
  entry: HitBreakdownEntry,
  key: HitBreakdownCategoricalKey,
): string | undefined => {
  if (key === "guardLevel") {
    return entry.guardLevel === undefined
      ? undefined
      : GUARD_LEVEL_META[entry.guardLevel].label;
  }
  return entry.airGroundJudgment === undefined
    ? undefined
    : AIR_GROUND_JUDGMENT_META[entry.airGroundJudgment].label;
};

/**
 * ヒット内訳の判定系フィールドを「1: 上段 / 2〜4: 空」形式で表示する。
 * 未設定のグループはヒット範囲ラベルごと省略する（位置は範囲ラベル自体が示すため）。
 */
export const formatHitBreakdownCategorical = (
  entries: HitBreakdownEntry[],
  key: HitBreakdownCategoricalKey,
): string => {
  const starts = hitBreakdownStartPositions(entries);
  return entries
    .map((entry, index) => {
      const label = hitBreakdownCategoricalEntryLabel(entry, key);
      return label === undefined
        ? undefined
        : `${hitRangeLabel(starts[index], entry.hitCount)}: ${label}`;
    })
    .filter((text): text is string => text !== undefined)
    .join(" / ");
};

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

/** ヒット硬直差 "down"（相手がダウンする技）の表示ラベル。 */
export const HIT_FRAME_ADVANTAGE_DOWN_LABEL = "ダウン";

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
  "projectileNullify",
];
export const AIR_GROUND_JUDGMENTS: AirGroundJudgment[] = ["air", "ground"];
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
