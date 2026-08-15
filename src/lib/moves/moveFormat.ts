import type {
  DamageValue,
  HitBreakdownEntry,
  JustInputAcceptFrames,
  Move,
  MoveAttackType,
  PhaseChangePointsValue,
  ResonanceFlinch,
  SpecialAttribute,
} from "@/types/move";
import type { HitBreakdownNumericKey } from "./moveEnums";
import {
  CHARGE_MAX_LABEL,
  MOVE_VARIANT_META,
  NO_VALUE_LABEL,
  RESONANCE_FLINCH_META,
  SPECIAL_ATTRIBUTE_META,
  STRENGTH_SYMBOL_META,
  TOTAL_DAMAGE_INLINE_LABEL,
} from "./moveLabels";
import {
  STRENGTH_RANGE_BY_ATTACK_TYPE,
  strengthSymbolsForAttackType,
} from "./moveRules";

/**
 * 技の値 1 つを表示文字列に変換する。文言そのものは moveLabels にあり、
 * ここは「どう並べて見せるか」だけを担う。
 * 「ヒット内訳があれば内訳ごと、無ければ技単位の代表値」という解決を伴う判定系の表示は
 * 抽象度が異なるため moveCategoricalDisplay に分ける。
 */

/**
 * その攻撃属性で入力できる強度の値の表現（例:「1〜8」「1〜9・◎・●」）。
 * 検証エラー文言（schema/attackRefinements の strengthNotAllowedMessage）と
 * 入力欄の placeholder（StrengthField）が同じ表現を共有するための唯一の整形関数。
 * 範囲は moveRules、記号ラベルは moveLabels の値を使うため、両方を扱えるここに置く
 * （moveLabels は moveRules を import できない横同士の関係のため）。
 */
export const formatStrengthAllowedValues = (attackType: MoveAttackType): string => {
  const range = STRENGTH_RANGE_BY_ATTACK_TYPE[attackType];
  const symbols = strengthSymbolsForAttackType(attackType).map(
    (symbol) => STRENGTH_SYMBOL_META[symbol].label,
  );
  return [`${range.min}〜${range.max}`, ...symbols].join("・");
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
 * 合計ダメージの表示テキスト。多段表記を取らない単一の実測値なので、
 * DamageValue 用の formatDamageValue とは分けて数値だけを扱う。未計測は NO_VALUE_LABEL。
 */
export const formatTotalDamage = (value: number | undefined): string =>
  value === undefined ? NO_VALUE_LABEL : `${value}`;

/**
 * 技一覧の基礎ダメージセルに併記する合計ダメージ（例:「（計72）」）。
 * 未入力なら空文字を返し、セルには基礎ダメージだけが出る。
 */
export const formatTotalDamageNote = (value: number | undefined): string =>
  value === undefined ? "" : `（${TOTAL_DAMAGE_INLINE_LABEL}${value}）`;

/**
 * ヒット内訳の数値フィールド（ダメージ系・PCH値）を「50+45×3」形式で表示する。
 * 各グループは formatDamageValue と同じ規約（hitCount>1 なら 値×hitCount）、
 * 未設定グループは NO_VALUE_LABEL。連結は「+」（「/」は択一表記と紛れるため使わない）。
 */
export const formatHitBreakdownValue = (
  entries: HitBreakdownEntry[],
  key: HitBreakdownNumericKey,
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

/**
 * PCH値の表示テキスト。未計測は NO_VALUE_LABEL、単一値はそのまま、区切りの配列は
 * formatHitBreakdownValue と同じ規約（hitCount>1 なら 値×hitCount、「+」連結）で表す。
 * 区切りが1ヒットのときはヒット数を省略する（例: 5+3.5×4）。
 */
export const formatPhaseChangePoints = (
  value: PhaseChangePointsValue | undefined,
): string => {
  if (value === undefined) {
    return NO_VALUE_LABEL;
  }
  if (typeof value === "number") {
    return `${value}`;
  }
  return value
    .map((segment) =>
      segment.hitCount > 1
        ? `${segment.perHit}×${segment.hitCount}`
        : `${segment.perHit}`,
    )
    .join("+");
};
