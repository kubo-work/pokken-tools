import {
  buildPhaseVariants,
  type FieldPhaseDiffKeys,
} from "@/lib/moves/phaseVariants";
import { moveColumnKey } from "@/lib/moves/variantMoves";
import type { Move, UsagePhase } from "@/types/move";

/** 一覧に並べる 1 行分の指定。技本体・ジャスト入力版・FP版を同じ形で扱う。 */
export interface MoveVariantRow {
  key: string;
  move: Move;
  /**
   * FP/DP で性能が変わる技のとき、その行がどちらのフェイズの値かを示す。
   * フェイズによる差が無い技（大多数）では undefined で、フェイズを名乗らない。
   * 結合時は "duel" 行が rowSpan を持ち、"field" 行が省略される側になる。
   */
  usagePhase: UsagePhase | undefined;
  isJustInputRow: boolean;
  /**
   * ため/派生のコマンド表示の基準になる親技のコマンド。親技自身の行では undefined。
   * 親のコマンドがフェイズで変わる技があるため、行のフェイズに合わせた値を持つ。
   */
  parentCommand: string | undefined;
}

/** 1 技分の展開結果。全行に共通する結合の判定材料を添える。 */
export interface MoveVariantRowsResult {
  rows: MoveVariantRow[];
  /**
   * フェイズ差で値が変わる項目。DP/FP 行のどのセルを rowSpan で結合できるかの判定に使う。
   * フェイズ差の無い技では undefined。
   */
  fieldPhaseDiffKeys: FieldPhaseDiffKeys;
}

/**
 * 1 技を、一覧に並べる行（本体・ジャスト入力版・FP版・FP版のジャスト入力）へ展開する。
 * 変種そのものの組み立ては buildPhaseVariants（詳細ページの列と共有）に委ね、ここでは
 * usagePhase と行キーを付けるだけを担う。
 *
 * 並び順は詳細ページの列（buildVariantColumns）と同じ（通常DP → 通常FP → ジャストDP → ジャストFP）。
 */
export const buildVariantRows = (
  move: Move,
  parentMove?: Move,
): MoveVariantRowsResult => {
  const { variants, hasPhaseDifference, fieldPhaseDiffKeys } =
    buildPhaseVariants(move, parentMove);
  return {
    rows: variants.map((variant) => ({
      key: moveColumnKey(move.id, {
        phase: variant.phase,
        justInput: variant.justInput,
      }),
      move: variant.move,
      usagePhase: hasPhaseDifference ? variant.phase : undefined,
      isJustInputRow: variant.justInput,
      parentCommand: variant.parentCommand,
    })),
    fieldPhaseDiffKeys,
  };
};
