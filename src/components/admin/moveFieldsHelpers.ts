import {
  AIR_GROUND_JUDGMENTS,
  AIR_GROUND_JUDGMENT_META,
  ATTACK_TYPE_META,
  CATEGORY_META,
  GUARD_LEVELS,
  GUARD_LEVEL_META,
  MOVE_ATTACK_TYPES,
  MOVE_CATEGORIES,
  RESONANCE_FLINCH_LEVELS,
  RESONANCE_FLINCH_META,
} from "@/lib/meta";

export const CATEGORY_OPTIONS = MOVE_CATEGORIES.map((category) => ({
  value: category,
  label: CATEGORY_META[category].label,
}));

export const ATTACK_TYPE_OPTIONS = MOVE_ATTACK_TYPES.map((attackType) => ({
  value: attackType,
  label: ATTACK_TYPE_META[attackType].label,
}));

export const GUARD_LEVEL_OPTIONS = GUARD_LEVELS.map((level) => ({
  value: level,
  label: GUARD_LEVEL_META[level].label,
}));

export const AIR_GROUND_OPTIONS = AIR_GROUND_JUDGMENTS.map((judgment) => ({
  value: judgment,
  label: AIR_GROUND_JUDGMENT_META[judgment].label,
}));

/** 任意項目が未入力（未計測）であることを示す placeholder。 */
export const PLACEHOLDER_NOT_MEASURED = "未計測";

/** 共鳴差分が未入力（通常時と同じ）であることを示す placeholder。 */
export const PLACEHOLDER_UNCHANGED = "変化なし";

/** ヒット内訳側で設定済みのため、この入力欄では設定できないことを示す placeholder。 */
export const PLACEHOLDER_SET_BY_HIT_BREAKDOWN = "ヒット内訳で設定済み";

/**
 * 共鳴怯ませ強度の入力モード。"transition" は「出始め弱→途中から強」で、
 * 選択時に切替フレーム (switchActiveFrame) を別途入力する。
 */
export type ResonanceFlinchMode = "weak" | "strong" | "transition";

/** 「弱→強」モードで切替フレーム未入力のときの初期値（持続 1F 目から強）。 */
export const DEFAULT_SWITCH_ACTIVE_FRAME = 1;

export const RESONANCE_FLINCH_OPTIONS: { value: ResonanceFlinchMode; label: string }[] = [
  ...RESONANCE_FLINCH_LEVELS.map((level) => ({
    value: level,
    label: RESONANCE_FLINCH_META[level].label,
  })),
  { value: "transition", label: "弱→強（切替）" },
];

export const RESONANCE_FLINCH_MODES: ResonanceFlinchMode[] =
  RESONANCE_FLINCH_OPTIONS.map((option) => option.value);

export type ResonanceNumberField =
  | "startup"
  | "guardFrameAdvantage"
  | "guardFrameAdvantageOnPokemonMoveCancel"
  | "hitFrameAdvantage"
  | "hitFrameAdvantageOnPokemonMoveCancel";

export const RESONANCE_NUMBER_FIELDS: {
  key: ResonanceNumberField;
  label: string;
  negative: boolean;
}[] = [
  { key: "startup", label: "発生", negative: false },
  { key: "guardFrameAdvantage", label: "ガード硬直差", negative: true },
  {
    key: "guardFrameAdvantageOnPokemonMoveCancel",
    label: "ポケモン技キャンセル時のガード硬直差",
    negative: true,
  },
  { key: "hitFrameAdvantage", label: "ヒット硬直差", negative: true },
  {
    key: "hitFrameAdvantageOnPokemonMoveCancel",
    label: "ポケモン技キャンセル時のヒット硬直差",
    negative: true,
  },
];
