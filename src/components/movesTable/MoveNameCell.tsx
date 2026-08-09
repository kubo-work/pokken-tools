import { Link } from "react-router";
import type { Move, UsagePhase } from "@/types/move";
import { CategoryBadge } from "@/components/badges";
import {
  JUST_INPUT_LABEL,
  PHASE_META,
  RESONANCE_ONLY_LABEL,
} from "@/lib/moves/moveLabels";
import {
  type MoveColumnVariant,
  moveColumnKey,
} from "@/lib/moves/variantMoves";
import { UI_COLORS, UI_SIZES } from "@/lib/uiTokens";
import { InlineTag } from "./InlineTag";

/** 技名セルの字下げ段数。子技で1段、ジャスト入力行でさらに1段下げる。 */
const rowIndentDepth = (isChild: boolean, isJustInputRow: boolean): number =>
  (isChild ? 1 : 0) + (isJustInputRow ? 1 : 0);

/** ため/派生・ジャスト入力・FP版は親の詳細ページに集約されているため、該当列へのアンカー付きで飛ばす。 */
const detailPageHrefOf = (
  move: Move,
  characterId: string,
  isChild: boolean,
  variant: MoveColumnVariant,
): string => {
  const moveId = isChild ? (move.parentMoveId ?? move.id) : move.id;
  const path = `/characters/${characterId}/moves/${moveId}`;
  const columnAnchor = moveColumnKey(move.id, variant);
  // 親技そのものの列は詳細ページの先頭なのでアンカーを付けない。
  if (!isChild && columnAnchor === move.id) {
    return path;
  }
  return `${path}#${columnAnchor}`;
};

export interface MoveNameCellProps {
  move: Move;
  characterId: string;
  isChild: boolean;
  isJustInputRow: boolean;
  usagePhase: UsagePhase | undefined;
  /** ため段階/派生のラベル。通常技では undefined。 */
  variantLabel: string | undefined;
}

/**
 * 技名セル。詳細ページへのリンクに、条件・変種を表すラベルと注記を添える。
 *
 * DP/FP 行を見分けるフェイズタグとリンク先アンカーがフェイズごとに異なるため、
 * 技名が同じでもこのセルだけは rowSpan で結合しない
 * （結合すると 2 行のどちらがどちらのフェイズか分からなくなる）。
 */
export const MoveNameCell = ({
  move,
  characterId,
  isChild,
  isJustInputRow,
  usagePhase,
  variantLabel,
}: MoveNameCellProps) => {
  const indentDepth = rowIndentDepth(isChild, isJustInputRow);
  return (
    <td>
      <span
        style={
          indentDepth === 0
            ? undefined
            : { paddingLeft: indentDepth * UI_SIZES.rowIndentStep }
        }
      >
        <CategoryBadge category={move.category} />
        <Link
          to={detailPageHrefOf(move, characterId, isChild, {
            phase: usagePhase ?? "duel",
            justInput: isJustInputRow,
          })}
          className="moves-table__move-link"
        >
          {move.name}
        </Link>
      </span>
      {isJustInputRow && (
        <InlineTag color={UI_COLORS.justInput}>
          {JUST_INPUT_LABEL.short}
        </InlineTag>
      )}
      {usagePhase !== undefined && (
        <InlineTag color={UI_COLORS.accent}>
          {PHASE_META[usagePhase].shortLabel}
        </InlineTag>
      )}
      {move.resonanceOnly === true && (
        <InlineTag color={UI_COLORS.resonance}>
          {RESONANCE_ONLY_LABEL.short}
        </InlineTag>
      )}
      {variantLabel !== undefined && (
        <InlineTag color={UI_COLORS.variant}>{variantLabel}</InlineTag>
      )}
      {move.note !== undefined && (
        <div style={{ fontSize: UI_SIZES.caption, color: UI_COLORS.mute }}>
          {move.note}
        </div>
      )}
    </td>
  );
};
