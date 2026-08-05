import {
  AIR_GROUND_JUDGMENTS,
  GUARD_LEVELS,
  MOVE_ATTACK_TYPES,
  MOVE_CATEGORIES,
  RESONANCE_FLINCH_LEVELS,
} from "@/lib/moves/moveEnums";
import {
  AIR_GROUND_JUDGMENT_META,
  ATTACK_TYPE_META,
  CATEGORY_META,
  GUARD_LEVEL_META,
  RESONANCE_FLINCH_META,
} from "@/lib/moves/moveLabels";
import type { ResonanceFlinchMode } from "@/lib/moves/moveUpdaters";
import type { Move } from "@/types/move";

/**
 * つかみ技かどうか。つかみは攻撃属性・強度・判定を持たないため、
 * 複数の入力欄コンポーネントが表示条件としてこの判定を使う。
 */
export const isGrabMove = (move: Move): boolean => move.category === "grab";

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

/** 条件付き差分（共鳴・ジャスト入力）が未入力＝通常時と同じであることを示す placeholder。 */
export const PLACEHOLDER_UNCHANGED = "変化なし";

/** ヒット内訳側で設定済みのため、この入力欄では設定できないことを示す placeholder。 */
export const PLACEHOLDER_SET_BY_HIT_BREAKDOWN = "ヒット内訳で設定済み";

export const RESONANCE_FLINCH_OPTIONS: { value: ResonanceFlinchMode; label: string }[] = [
  ...RESONANCE_FLINCH_LEVELS.map((level) => ({
    value: level,
    label: RESONANCE_FLINCH_META[level].label,
  })),
  { value: "transition", label: "弱→強（切替）" },
];

export const RESONANCE_FLINCH_MODES: ResonanceFlinchMode[] =
  RESONANCE_FLINCH_OPTIONS.map((option) => option.value);

/** MoveOverride が持つ数値フィールド。共鳴・ジャスト入力など全ての条件付き差分で共通。 */
export type MoveOverrideNumberField =
  | "startup"
  | "activeUntilFrame"
  | "guardFrameAdvantage"
  | "guardFrameAdvantageOnPokemonMoveCancel"
  | "hitFrameAdvantage"
  | "hitFrameAdvantageOnPokemonMoveCancel";

export const MOVE_OVERRIDE_NUMBER_FIELDS: {
  key: MoveOverrideNumberField;
  label: string;
  negative: boolean;
  /**
   * 入力欄の下限。スキーマ側の制約と一致させること（例: 攻撃持続は positive なので 1）。
   * 下限を持たない項目（負の値を取る硬直差など）は省略する。
   */
  min?: number;
}[] = [
  { key: "startup", label: "発生", negative: false, min: 0 },
  { key: "activeUntilFrame", label: "攻撃持続", negative: false, min: 1 },
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
