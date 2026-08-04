import type {
  AirGroundJudgment,
  GuardLevel,
  MoveAttackType,
  MoveCategory,
  MoveVariant,
  Phase,
  ResonanceFlinchLevel,
  SpecialAttribute,
} from "@/types/move";

/**
 * 技の各値に対応する表示文言。文言そのものだけを持ち、値からラベルを組み立てる処理は
 * moveFormat に置く。ここを変更しても技の意味は変わらない（表示だけが変わる）。
 */

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

export const RESONANCE_FLINCH_META: Record<
  ResonanceFlinchLevel,
  { label: string }
> = {
  weak: { label: "弱" },
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

/**
 * 値を持たない（未計測、またはその技には概念が無い）ことを表す表示テキスト。
 * 技一覧・技詳細・整形関数のすべてがこの 1 つを参照する。
 * 管理画面の入力欄 placeholder（"未計測"）は「これから入力する欄」を指す別概念なので共有しない。
 */
export const NO_VALUE_LABEL = "-";

/** 最大ため段階の表示ラベル。 */
export const CHARGE_MAX_LABEL = "ためMAX";

/**
 * resonanceOnly（共鳴中のみ存在する技）に付けるラベル。
 * 省スペースの一覧では short、詳細ページでは full を使う。
 */
export const RESONANCE_ONLY_LABEL = { short: "共鳴", full: "共鳴専用" } as const;

/**
 * ジャスト入力版の技行・列に付けるラベル。
 * 省スペースの一覧では short、詳細ページでは full を使う。
 */
export const JUST_INPUT_LABEL = { short: "J", full: "ジャスト" } as const;

/** ヒット硬直差 "down"（相手がダウンする技）の表示ラベル。 */
export const HIT_FRAME_ADVANTAGE_DOWN_LABEL = "ダウン";

/** 技一覧のガード/ヒット硬直差セルで、ポケモン技キャンセル時の値の前に付ける接頭ラベル。 */
export const POKEMON_MOVE_CANCEL_LABEL = "ポ: ";

/**
 * ラベルの詳細度。"full" は詳細ページ向けのフルラベル（例:「上段」）、
 * "short" は一覧など省スペースな表示向けの短縮ラベル（例:「上」）。
 */
export type LabelStyle = "full" | "short";

export const GUARD_LEVEL_LABEL_KEY_BY_STYLE: Record<
  LabelStyle,
  "label" | "shortLabel"
> = {
  full: "label",
  short: "shortLabel",
};
