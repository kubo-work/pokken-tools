import type { GuardFrameAdvantage } from "@/types/move";

/**
 * 確反判定に使える、既知の中で最も不利側のガード硬直差を返す。範囲なら min
 * （当て方が攻撃側に最も悪いケース）。確定反撃検索で「不利側でのみ確定する反撃」まで
 * 候補に含めるために使う。
 *
 * min が未計測なら真の不利側は不明なため、既知の max で代用する。したがって戻り値は
 * 「攻撃側にとって最悪のケース」の下限を保証しない（実際の硬直差はこれより不利側に
 * 振れうる）。下限が必要な用途にこの値を使ってはならない。
 */
export const knownWorstGuardFrameAdvantage = (
  value: GuardFrameAdvantage,
): number =>
  // min・max が両方とも未設定の範囲は frameAdvantageRangeSchema が拒否するため、
  // スキーマ検証を通ったデータではここが undefined になることはない。
  typeof value === "number" ? value : (value.min ?? value.max)!;

/**
 * ガード硬直差の最も有利側の値を返す。範囲なら max（当て方が攻撃側に最も良いケース）。
 * max が未計測（有利側が判明していない技）なら undefined を返す。
 * この値でも確定する反撃は当て方によらず確定する。
 */
export const bestGuardFrameAdvantage = (
  value: GuardFrameAdvantage,
): number | undefined => (typeof value === "number" ? value : value.max);

/**
 * 確反検索の「余裕フレーム」表示用文字列。余裕フレーム = -ガード硬直差。
 * 範囲なら「最小〜最大」（例: 4〜8）で返す。片側が未計測なら「8〜」「〜4」のように省略する。
 */
export const formatPunishWindow = (value: GuardFrameAdvantage): string => {
  if (typeof value === "number") {
    return `${-value}`;
  }
  // 硬直差と余裕フレームは符号が逆なので、範囲の max（攻撃側が最も有利）が
  // 余裕の最小値、min（最も不利）が余裕の最大値になる。
  const smallestWindow = value.max === undefined ? undefined : -value.max;
  const largestWindow = value.min === undefined ? undefined : -value.min;
  return `${smallestWindow ?? ""}〜${largestWindow ?? ""}`;
};
