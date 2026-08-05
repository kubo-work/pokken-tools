import type {
  DamageValue,
  HitBreakdownEntry,
  JustInputAcceptFrames,
  Move,
  ResonanceFlinch,
  SpecialAttribute,
} from "@/types/move";
import type { HitBreakdownDamageKey } from "./moveEnums";
import {
  CHARGE_MAX_LABEL,
  MOVE_VARIANT_META,
  NO_VALUE_LABEL,
  RESONANCE_FLINCH_META,
  SPECIAL_ATTRIBUTE_META,
} from "./moveLabels";

/**
 * 技の値 1 つを表示文字列に変換する。文言そのものは moveLabels にあり、
 * ここは「どう並べて見せるか」だけを担う。
 * 「ヒット内訳があれば内訳ごと、無ければ技単位の代表値」という解決を伴う判定系の表示は
 * 抽象度が異なるため moveCategoricalDisplay に分ける。
 */

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

/**
 * ため段階の表示ラベルを返す。
 * - 段階が単一（maxLevel<=1）または未設定なら単に「ため」
 * - 最大段階なら「ためMAX」
 * - それ以外は「ため{段階}」（例: ため2）
 */
const chargeStageLabel = (
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

/** ジャスト入力の受付フレーム範囲の表示テキスト（例: 「8〜10F」）。未計測なら undefined。 */
export const formatJustInputAcceptFrames = (
  value: JustInputAcceptFrames | undefined,
): string | undefined =>
  value === undefined ? undefined : `${value.start}〜${value.end}F`;

/** 攻撃持続の表示テキスト（例: 「〜27F」）。未計測なら undefined。 */
export const formatActiveUntilFrame = (
  value: number | undefined,
): string | undefined => (value === undefined ? undefined : `〜${value}F`);

/**
 * 共鳴怯ませ強度の表示ラベルを返す。
 * - 未設定（つかみ等）→ NO_VALUE_LABEL
 * - 常時一定 → "弱" / "強"
 * - 出始め弱→途中強 → "弱→強（持続{N}〜）"
 */
export const resonanceFlinchLabel = (
  value: ResonanceFlinch | undefined,
): string => {
  if (value === undefined) {
    return NO_VALUE_LABEL;
  }
  if (value === "weak" || value === "strong") {
    return RESONANCE_FLINCH_META[value].label;
  }
  return `${RESONANCE_FLINCH_META.weak.label}→${RESONANCE_FLINCH_META.strong.label}（持続${value.switchActiveFrame}〜）`;
};

/**
 * ダメージ系の値の表示ラベル。未計測 (undefined) は NO_VALUE_LABEL、
 * 多段ヒットは「20×3」形式で返す。
 */
export const formatDamageValue = (value: DamageValue | undefined): string => {
  if (value === undefined) {
    return NO_VALUE_LABEL;
  }
  if (typeof value === "number") {
    return `${value}`;
  }
  return `${value.perHit}×${value.hitCount}`;
};

/**
 * ヒット内訳のダメージ系フィールドを「50+45×3」形式で表示する。
 * 各グループは formatDamageValue と同じ規約（hitCount>1 なら 値×hitCount）、
 * 未設定グループは NO_VALUE_LABEL。連結は「+」（「/」は択一表記と紛れるため使わない）。
 */
export const formatHitBreakdownDamage = (
  entries: HitBreakdownEntry[],
  key: HitBreakdownDamageKey,
): string =>
  entries
    .map((entry) => {
      const value = entry[key];
      if (value === undefined) {
        return NO_VALUE_LABEL;
      }
      return entry.hitCount > 1 ? `${value}×${entry.hitCount}` : `${value}`;
    })
    .join("+");
