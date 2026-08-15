import type { ReactNode } from "react";
import type { FieldPhaseOverride, Move, UsagePhase } from "@/types/move";
import { FrameAdvantageText } from "@/components/FrameAdvantageText";
import { FrameNumber } from "@/components/FrameNumber";
import {
  moveAirGroundJudgmentLabel,
  moveAttackTypeShortLabel,
  moveGuardLevelShortLabel,
  moveStrengthShortLabel,
} from "@/lib/moves/moveCategoricalDisplay";
import {
  childVariantLabel,
  formatDamageValue,
  formatHitBreakdownValue,
  formatTotalDamageNote,
} from "@/lib/moves/moveFormat";
import {
  NO_VALUE_LABEL,
  POKEMON_MOVE_CANCEL_LABEL,
} from "@/lib/moves/moveLabels";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import { formatMoveCommand } from "@/lib/moves/command";
import { isChildMove } from "@/lib/moves/grouping";
import { isPhaseInvariantCell } from "@/lib/moves/fieldPhaseDisplay";
import { UI_COLORS, UI_SIZES } from "@/lib/uiTokens";
import { InlineTag } from "./InlineTag";
import { MoveNameCell } from "./MoveNameCell";

export interface MoveRowProps {
  move: Move;
  characterId: string;
  parentCommand?: string;
  /** 同じ親グループ内のため段階の最大値。ため子技のラベルを「ためMAX」にするか判定する。 */
  chargeMaxLevel?: number;
  /** true なら「元の技のジャスト入力版」の行として、通常行より1段深く字下げしバッジを付ける。 */
  isJustInputRow?: boolean;
  /**
   * FP/DP で性能が変わる技のとき、その行がどちらのフェイズの値かを示す。
   * フェイズによる差が無い技（大多数）では undefined で、フェイズを名乗らない。
   */
  usagePhase?: UsagePhase;
  /** DP/FP 行のセル結合の判定材料。フェイズ差の無い技では undefined（結合しない）。 */
  fieldPhaseDiffKeys?: (keyof FieldPhaseOverride)[];
}

/** セル 1 つ分の結合指示。省略するか、直下の行まで rowSpan で覆うか。 */
interface PhaseCellMerge {
  omit: boolean;
  rowSpan: number | undefined;
}

const NO_MERGE: PhaseCellMerge = { omit: false, rowSpan: undefined };

/** そのセルが読む項目を渡すと、結合指示を返す関数。行ごとに 1 つ作る。 */
type PhaseCellMergeResolver = (
  dependentKeys: (keyof FieldPhaseOverride)[],
) => PhaseCellMerge;

/**
 * DP/FP の 2 行に分かれた技で、セルを縦方向に結合するかを決める。
 * フェイズで変わらないセルは DP 行が rowSpan=2 で覆い、FP 行では描画しない。
 */
const phaseCellMergeResolverOf = (
  usagePhase: UsagePhase | undefined,
  fieldPhaseDiffKeys: (keyof FieldPhaseOverride)[] | undefined,
): PhaseCellMergeResolver => {
  if (usagePhase === undefined || fieldPhaseDiffKeys === undefined) {
    return () => NO_MERGE;
  }
  return (dependentKeys) => {
    if (!isPhaseInvariantCell(fieldPhaseDiffKeys, dependentKeys)) {
      return NO_MERGE;
    }
    return usagePhase === "duel"
      ? { omit: false, rowSpan: 2 }
      : { omit: true, rowSpan: undefined };
  };
};

/**
 * 結合指示に従って描画するセル。
 * merge に渡す項目はそのセルの表示が読むもの。**表示する項目を変えたらその指定も
 * 必ず更新すること**（食い違うと、値が違うセルを結合して誤表示になる）。
 */
const PhaseCell = ({
  merge,
  className,
  children,
}: {
  merge: PhaseCellMerge;
  className?: string;
  children: ReactNode;
}) =>
  merge.omit ? null : (
    <td className={className} rowSpan={merge.rowSpan}>
      {children}
    </td>
  );

/** ガード/ヒット硬直差セルの下段に「ポ: xx」を表示する。値が無い技では何も描画しない。 */
const PokemonMoveCancelNote = ({ value }: { value: number | undefined }) => {
  if (value === undefined) {
    return null;
  }
  return (
    <div style={{ fontSize: UI_SIZES.caption, color: UI_COLORS.mute }}>
      {POKEMON_MOVE_CANCEL_LABEL}
      <FrameNumber value={value} />
    </div>
  );
};

/** 強度・発生・硬直差・基礎ダメージの数値セル群。技名まわりと違い状態に依存しない。 */
const MoveFrameCells = ({
  move,
  mergeFor,
}: {
  move: Move;
  mergeFor: PhaseCellMergeResolver;
}) => (
  <>
    <PhaseCell merge={mergeFor(["strength"])} className="num">
      {moveStrengthShortLabel(move) ?? NO_VALUE_LABEL}
    </PhaseCell>
    <PhaseCell merge={mergeFor(["startup"])} className="num">
      {move.startup}
    </PhaseCell>
    <PhaseCell
      merge={mergeFor([
        "guardFrameAdvantage",
        "guardFrameAdvantageOnPokemonMoveCancel",
      ])}
      className="num"
    >
      <FrameAdvantageText value={move.guardFrameAdvantage} />
      <PokemonMoveCancelNote
        value={move.guardFrameAdvantageOnPokemonMoveCancel}
      />
    </PhaseCell>
    <PhaseCell
      merge={mergeFor([
        "hitFrameAdvantage",
        "hitFrameAdvantageOnPokemonMoveCancel",
      ])}
      className="num moves-table__secondary"
    >
      {move.hitFrameAdvantage === undefined ? (
        NO_VALUE_LABEL
      ) : (
        <FrameAdvantageText value={move.hitFrameAdvantage} />
      )}
      <PokemonMoveCancelNote value={move.hitFrameAdvantageOnPokemonMoveCancel} />
    </PhaseCell>
    <PhaseCell
      merge={mergeFor(["baseDamage", "totalDamage"])}
      className="num moves-table__secondary"
    >
      {move.hitBreakdown !== undefined &&
      hitBreakdownDefines(move.hitBreakdown, "baseDamage")
        ? formatHitBreakdownValue(move.hitBreakdown, "baseDamage")
        : formatDamageValue(move.baseDamage)}
      {formatTotalDamageNote(move.totalDamage)}
    </PhaseCell>
  </>
);

export const MoveRow = ({
  move,
  characterId,
  parentCommand,
  chargeMaxLevel = 0,
  isJustInputRow = false,
  usagePhase,
  fieldPhaseDiffKeys,
}: MoveRowProps) => {
  const isChild = isChildMove(move);
  const command = formatMoveCommand(move, parentCommand);
  const airGroundJudgmentText = moveAirGroundJudgmentLabel(move);
  const mergeFor = phaseCellMergeResolverOf(usagePhase, fieldPhaseDiffKeys);
  return (
    <tr className={isChild ? "moves-table__child" : undefined}>
      <MoveNameCell
        move={move}
        characterId={characterId}
        isChild={isChild}
        isJustInputRow={isJustInputRow}
        usagePhase={usagePhase}
        variantLabel={childVariantLabel(move, chargeMaxLevel)}
      />
      {/* 判定・空地判定はいずれもフェイズで変わらない（FieldPhaseOverride に無い）。 */}
      <PhaseCell merge={mergeFor([])} className="moves-table__secondary">
        {moveGuardLevelShortLabel(move)}
        {airGroundJudgmentText !== undefined && (
          <InlineTag color={UI_COLORS.mute}>{airGroundJudgmentText}</InlineTag>
        )}
      </PhaseCell>
      <PhaseCell merge={mergeFor(["command"])}>{command}</PhaseCell>
      {/* 攻撃属性はフェイズで変わらない。 */}
      <PhaseCell merge={mergeFor([])} className="moves-table__secondary">
        {moveAttackTypeShortLabel(move) ?? NO_VALUE_LABEL}
      </PhaseCell>
      <MoveFrameCells move={move} mergeFor={mergeFor} />
    </tr>
  );
};
