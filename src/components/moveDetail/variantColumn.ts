import { childVariantLabel } from "@/lib/moves/moveFormat";
import { JUST_INPUT_LABEL, MOVE_VARIANT_META, PHASE_META } from "@/lib/moves/moveLabels";
import { buildPhaseVariants, type PhaseVariant } from "@/lib/moves/phaseVariants";
import { moveColumnKey } from "@/lib/moves/resolveMove";
import type { ComparisonColumn } from "@/components/MoveComparisonTable";
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

/**
 * 1 つの技を、比較テーブルの列（本体・ジャスト入力版・FP版・FP版のジャスト入力）に展開する。
 * 変種そのものの組み立ては buildPhaseVariants（一覧の行と共有）に委ね、ここではラベルと
 * 列キーを付けるだけを担う。
 *
 * フェイズを名乗るのは hasPhaseDifference のときだけ（従来どおりフェイズ差の無い技は
 * フェイズを名乗らない）。FP 列にだけ結合判定の材料（fieldPhaseDiffKeys）を付ける
 * （DP 列は基準値なので判定不要）。
 */
export const buildVariantColumns = (
  move: Move,
  parentMove: Move,
  chargeMaxLevel: number,
): ComparisonColumn[] => {
  const variantLabel = variantColumnLabel(move, parentMove, chargeMaxLevel);
  const { variants, hasPhaseDifference, fieldPhaseDiffKeys } =
    buildPhaseVariants(move, parentMove);

  const toColumn = (variant: PhaseVariant): ComparisonColumn => {
    const phaseLabel = hasPhaseDifference
      ? PHASE_META[variant.phase].shortLabel
      : "";
    const justInputLabel = variant.justInput ? JUST_INPUT_LABEL.full : "";
    return {
      key: moveColumnKey(move.id, {
        phase: variant.phase,
        justInput: variant.justInput,
      }),
      move: variant.move,
      label: `${variantLabel}${phaseLabel}${justInputLabel}`,
      parentCommand: variant.parentCommand,
      ...(variant.justInput ? { isJustInput: true } : {}),
      ...(variant.phase === "field" ? { fieldPhaseDiffKeys } : {}),
    };
  };

  return variants.map(toColumn);
};
