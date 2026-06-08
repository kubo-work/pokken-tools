import { Fragment } from "react";
import type { Move } from "@/types/move";
import { CategoryBadge, GuardBadge } from "@/components/badges";
import { FrameNumber } from "@/components/FrameNumber";
import {
  ATTACK_TYPE_META,
  GUARD_LEVEL_META,
  MOVE_VARIANT_META,
  SPECIAL_ATTRIBUTE_META,
} from "@/lib/meta";
import { groupMovesByParent } from "@/lib/moves/grouping";
import {
  DESCRIPTION_BLOCK_BG,
  UI_COLORS,
  UI_SIZES,
} from "@/lib/uiTokens";

const TABLE_COLUMN_COUNT = 9;

interface MoveRowProps {
  move: Move;
  parentCommand?: string;
}

const MoveRow = ({ move, parentCommand }: MoveRowProps) => {
  const isChild = move.variant !== undefined && move.variant !== "normal";
  const command =
    parentCommand !== undefined
      ? `${parentCommand} > ${move.command}`
      : move.command;
  return (
    <tr className={isChild ? "moves-table__child" : undefined}>
      <td>
        <CategoryBadge category={move.category} />
        {move.resonanceOnly === true && (
          <span
            style={{
              marginLeft: 4,
              fontSize: UI_SIZES.caption,
              color: UI_COLORS.resonance,
            }}
          >
            共鳴
          </span>
        )}
        {isChild && (
          <span
            style={{
              marginLeft: 4,
              fontSize: UI_SIZES.caption,
              color: UI_COLORS.variant,
            }}
          >
            {MOVE_VARIANT_META[move.variant!].label}
          </span>
        )}
      </td>
      <td>
        <span style={isChild ? { paddingLeft: 16 } : undefined}>
          {move.name}
        </span>
        {move.note !== undefined && (
          <div style={{ fontSize: UI_SIZES.caption, color: UI_COLORS.mute }}>
            {move.note}
          </div>
        )}
      </td>
      <td>{command}</td>
      <td>
        <GuardBadge level={move.guardLevel} />
        {move.resonance?.guardLevel !== undefined && (
          <span style={{ color: UI_COLORS.resonance, marginLeft: 4 }}>
            →{GUARD_LEVEL_META[move.resonance.guardLevel].shortLabel}
          </span>
        )}
      </td>
      <td>
        {move.attackType === undefined
          ? "-"
          : ATTACK_TYPE_META[move.attackType].label}
      </td>
      <td>
        {move.specialAttributes === undefined ||
        move.specialAttributes.length === 0
          ? "-"
          : move.specialAttributes
              .map((attr) => SPECIAL_ATTRIBUTE_META[attr].label)
              .join(" / ")}
      </td>
      <td className="num">
        {move.startup}
        {move.resonance?.startup !== undefined && (
          <span style={{ color: UI_COLORS.resonance }}>
            {" "}
            →{move.resonance.startup}
          </span>
        )}
      </td>
      <td className="num">
        <FrameNumber value={move.guardFrameAdvantage} />
        {move.resonance?.guardFrameAdvantage !== undefined && (
          <span style={{ color: UI_COLORS.resonance }}>
            {" "}
            →<FrameNumber value={move.resonance.guardFrameAdvantage} />
          </span>
        )}
      </td>
      <td className="num">
        {move.hitFrameAdvantage === undefined ? (
          "-"
        ) : (
          <FrameNumber value={move.hitFrameAdvantage} />
        )}
        {move.resonance?.hitFrameAdvantage !== undefined && (
          <span style={{ color: UI_COLORS.resonance }}>
            {" "}
            →<FrameNumber value={move.resonance.hitFrameAdvantage} />
          </span>
        )}
      </td>
    </tr>
  );
};

const DescriptionRow = ({ description }: { description: string }) => (
  <tr className="moves-table__description">
    <td colSpan={TABLE_COLUMN_COUNT} style={{ background: "transparent" }}>
      <details>
        <summary
          style={{
            fontSize: UI_SIZES.small,
            cursor: "pointer",
            color: UI_COLORS.accent,
            userSelect: "none",
            paddingLeft: 8,
          }}
        >
          説明
        </summary>
        <div
          style={{
            fontSize: UI_SIZES.body,
            marginTop: 6,
            padding: "8px 12px",
            color: UI_COLORS.description,
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            background: DESCRIPTION_BLOCK_BG,
            borderLeft: `3px solid ${UI_COLORS.accent}`,
            borderRadius: 4,
          }}
        >
          {description}
        </div>
      </details>
    </td>
  </tr>
);

/**
 * 技一覧テーブル。共鳴差分はセル内に黄色で並記し、凡例をテーブル上部に出す。
 * description を持つ技は技行の直下に colspan で全幅の説明行を展開する。
 * ため・派生は親技の直下にぶら下げて表示。
 */
export const MovesTable = ({ moves }: { moves: Move[] }) => {
  if (moves.length === 0) {
    return <div className="empty">登録されている技がありません。</div>;
  }
  const groups = groupMovesByParent(moves);
  return (
    <>
      <p
        style={{
          fontSize: UI_SIZES.small,
          color: UI_COLORS.mute,
          margin: "0 0 6px",
        }}
      >
        黄色の「<span style={{ color: UI_COLORS.resonance }}>→値</span>
        」は共鳴中の値です。
      </p>
      <table className="moves-table">
        <thead>
          <tr>
            <th>分類</th>
            <th>技名</th>
            <th>コマンド</th>
            <th>判定</th>
            <th>攻撃属性</th>
            <th>特殊</th>
            <th className="num">発生</th>
            <th className="num">ガード硬直差</th>
            <th className="num">ヒット硬直差</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(({ parent, children }) => (
            <Fragment key={parent.id}>
              <MoveRow move={parent} />
              {parent.description !== undefined && (
                <DescriptionRow description={parent.description} />
              )}
              {children.map((child) => (
                <Fragment key={child.id}>
                  <MoveRow move={child} parentCommand={parent.command} />
                  {child.description !== undefined && (
                    <DescriptionRow description={child.description} />
                  )}
                </Fragment>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
};
