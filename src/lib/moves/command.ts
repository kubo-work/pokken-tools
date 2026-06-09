import type { Move } from "@/types/move";

/** ため技の接尾辞。同じボタンを押しっぱなしで完結することを表す。 */
const CHARGE_SUFFIX = "長押し";

/** 派生技で親コマンドと追加入力をつなぐ区切り。 */
const DERIVATIVE_SEPARATOR = " > ";

/**
 * 技のコマンド表示文字列を組み立てる。一覧テーブルと確定反撃検索で同じ規約を使うため共通化する。
 *
 * - 派生 (derivative): 親コマンドに子の追加入力を「>」で連結する（例: 5Y > X）。
 *   子の command には「追加入力のみ」を入れる規約（先頭に「>」を付けない）。
 * - ため (charge): 同じボタンを押しっぱなしで完結するため連結はせず、親コマンドに「長押し」を付ける（例: 5X長押し）。
 *   ため技の command は使わない（段階は chargeLevel で表現する）。
 * - 通常 (normal): 自身の command をそのまま使う。
 */
export const formatMoveCommand = (
  move: Move,
  parentCommand: string | undefined,
): string => {
  if (move.variant === "charge") {
    const base = parentCommand ?? move.command;
    return `${base}${CHARGE_SUFFIX}`;
  }
  if (parentCommand !== undefined) {
    return `${parentCommand}${DERIVATIVE_SEPARATOR}${move.command}`;
  }
  return move.command;
};
