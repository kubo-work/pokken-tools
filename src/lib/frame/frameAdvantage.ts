import type { GuardFrameAdvantage } from "@/types/move";

/**
 * ガード硬直差の最も不利側の値を返す。範囲なら min（当て方が攻撃側に最も悪いケース）。
 * 確定反撃検索で「不利側でのみ確定する反撃」まで候補に含めるために使う。
 */
export const worstGuardFrameAdvantage = (value: GuardFrameAdvantage): number =>
  typeof value === "number" ? value : value.min;

/**
 * ガード硬直差の最も有利側の値を返す。範囲なら max（当て方が攻撃側に最も良いケース）。
 * この値でも確定する反撃は当て方によらず確定する。
 */
export const bestGuardFrameAdvantage = (value: GuardFrameAdvantage): number =>
  typeof value === "number" ? value : value.max;

/**
 * 確反検索の「余裕フレーム」表示用文字列。余裕フレーム = -ガード硬直差。
 * 範囲なら「最小〜最大」（例: 4〜8）で返す。
 */
export const formatPunishWindow = (value: GuardFrameAdvantage): string =>
  typeof value === "number"
    ? `${-value}`
    : `${-value.max}〜${-value.min}`;
