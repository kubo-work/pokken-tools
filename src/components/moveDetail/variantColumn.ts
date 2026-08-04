import { childVariantLabel } from "@/lib/moves/moveFormat";
import { MOVE_VARIANT_META } from "@/lib/moves/moveLabels";
import type { Move } from "@/types/move";

/**
 * 技詳細ページの比較テーブルの「列」に関する表示ロジック。
 * 行の定義（frameRows / damageRows / attributeRows）とは軸が違うため分けている。
 */

/** 変種の列ラベル。親は「通常」、子はため段階/派生のラベルを使う。 */
export const variantColumnLabel = (
  move: Move,
  parentMove: Move,
  chargeMaxLevel: number,
): string => {
  if (move.id === parentMove.id) {
    return MOVE_VARIANT_META.normal.label;
  }
  // 親以外は必ず子技（charge/derivative）なので childVariantLabel は値を返すが、
  // 型を string に確定させるため variant 既定ラベルでフォールバックする。
  return (
    childVariantLabel(move, chargeMaxLevel) ??
    MOVE_VARIANT_META[move.variant ?? "normal"].label
  );
};
