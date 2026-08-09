import { fieldPhaseDiffKeysOf } from "@/lib/moves/fieldPhaseDisplay";
import {
  resolveFieldPhaseMove,
  resolveJustInputMove,
} from "@/lib/moves/resolveMove";
import type { FieldPhaseOverride, Move, UsagePhase } from "@/types/move";

/** DP/FP のどのセルを結合できるかの判定材料。フェイズ差の無い技では undefined。 */
export type FieldPhaseDiffKeys = (keyof FieldPhaseOverride)[] | undefined;

/**
 * 1 技を DP/FP・ジャスト入力の有無で展開した「変種」1 つ分。
 * 技詳細ページの列（buildVariantColumns）と技一覧の行（buildVariantRows）は、
 * この配列にラベル・行列キーなど表示固有の情報を付けるだけの写像として作る。
 */
export interface PhaseVariant {
  phase: UsagePhase;
  justInput: boolean;
  move: Move;
  /**
   * ため/派生のコマンド表示の基準になる親技のコマンド。親技自身の変種では undefined。
   * 親のコマンドがフェイズで変わる技があるため、変種のフェイズに合わせた値を持つ。
   */
  parentCommand: string | undefined;
}

/** 1 技分の展開結果。全変種に共通する結合の判定材料を添える。 */
export interface MovePhaseVariants {
  /** 並び順はジャスト入力の有無で区切り、その中で DP → FP
   *（通常DP → 通常FP → ジャストDP → ジャストFP）。DP/FP を隣接させることで、
   * 詳細ページは colSpan、一覧は rowSpan によるセル結合が可能になる。 */
  variants: PhaseVariant[];
  /** FP で性能が変わる技か（親のコマンド差だけの場合も含む）。 */
  hasPhaseDifference: boolean;
  fieldPhaseDiffKeys: FieldPhaseDiffKeys;
}

/**
 * 1 技を、DP/FP・ジャスト入力の変種へ展開する。
 *
 * FP で性能が変わる技は DP 変種と FP 変種を並べ、どちらにもフェイズを明示する。
 * 技本体を DP の値として格納しているのはデータ上の都合にすぎず、DP の値だけを代表値として
 * 出すと FP の値が存在しないかのように読めてしまうため。フェイズ差の無い技は
 * 従来どおり変種 1 つのみで、フェイズを名乗らない。
 *
 * 自身に fieldPhase が無くても、親のコマンドがフェイズで変わる子技は表示コマンドが変わるため
 * DP/FP 変種に分かれる（その場合コマンド以外はすべて結合できる）。
 *
 * parentMove は「この技の表示コマンドの組み立てに使う親」。親技自身を展開するときは
 * 渡さない（またはこの技自身を渡す）。
 */
export const buildPhaseVariants = (
  move: Move,
  parentMove?: Move,
): MovePhaseVariants => {
  const isParent = parentMove === undefined || move.id === parentMove.id;
  const fieldPhaseMove = resolveFieldPhaseMove(move);
  const parentFieldPhaseCommand = isParent
    ? undefined
    : parentMove?.fieldPhase?.command;
  const hasPhaseDifference =
    fieldPhaseMove !== undefined || parentFieldPhaseCommand !== undefined;

  const parentCommandFor = (phase: UsagePhase): string | undefined => {
    if (isParent) {
      return undefined;
    }
    return phase === "field"
      ? (parentFieldPhaseCommand ?? parentMove?.command)
      : parentMove?.command;
  };

  const variantsForJustInput = (justInput: boolean): PhaseVariant[] => {
    const duelMove = justInput ? resolveJustInputMove(move, "duel") : move;
    if (duelMove === undefined) {
      return [];
    }
    const duelVariant: PhaseVariant = {
      phase: "duel",
      justInput,
      move: duelMove,
      parentCommand: parentCommandFor("duel"),
    };
    if (!hasPhaseDifference) {
      return [duelVariant];
    }
    // 自身に fieldPhase が無くても（親のコマンド差だけの場合）FP 変種は必要なので、
    // その場合は自身の値をそのまま使う。
    const fieldMove = justInput
      ? resolveJustInputMove(move, "field")
      : (fieldPhaseMove ?? move);
    if (fieldMove === undefined) {
      return [duelVariant];
    }
    return [
      duelVariant,
      {
        phase: "field",
        justInput,
        move: fieldMove,
        parentCommand: parentCommandFor("field"),
      },
    ];
  };

  return {
    variants: [...variantsForJustInput(false), ...variantsForJustInput(true)],
    hasPhaseDifference,
    fieldPhaseDiffKeys: hasPhaseDifference
      ? fieldPhaseDiffKeysOf(move, parentFieldPhaseCommand)
      : undefined,
  };
};
