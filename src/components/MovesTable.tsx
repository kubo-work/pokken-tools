import { Fragment } from "react";
import Link from "next/link";
import type { Move } from "@/types/move";
import { CategoryBadge } from "@/components/badges";
import { FrameAdvantageText } from "@/components/FrameAdvantageText";
import { StrengthHelpPopover } from "@/components/StrengthHelpPopover";
import {
  ATTACK_TYPE_META,
  RESONANCE_ONLY_LABEL,
  childVariantLabel,
  formatDamageValue,
  hitBreakdownDefines,
  maxChargeLevel,
  moveAirGroundJudgmentLabel,
  moveGuardLevelShortLabel,
  totalHitBreakdownDamage,
} from "@/lib/meta";
import { formatMoveCommand } from "@/lib/moves/command";
import { groupMovesByParent, isChildMove } from "@/lib/moves/grouping";
import { UI_COLORS, UI_SIZES } from "@/lib/uiTokens";

interface MoveRowProps {
  move: Move;
  characterId: string;
  parentCommand?: string;
  /** 同じ親グループ内のため段階の最大値。ため子技のラベルを「ためMAX」にするか判定する。 */
  chargeMaxLevel?: number;
}

const MoveRow = ({
  move,
  characterId,
  parentCommand,
  chargeMaxLevel = 0,
}: MoveRowProps) => {
  const isChild = isChildMove(move);
  const command = formatMoveCommand(move, parentCommand);
  const variantLabel = childVariantLabel(move, chargeMaxLevel);
  const airGroundJudgmentText = moveAirGroundJudgmentLabel(move);
  // ため/派生は親の詳細ページに集約されているため、該当変種列へのアンカー付きで親ページへ飛ばす。
  const detailPageHref = isChild
    ? `/characters/${characterId}/moves/${move.parentMoveId ?? move.id}#${move.id}`
    : `/characters/${characterId}/moves/${move.id}`;
  return (
    <tr className={isChild ? "moves-table__child" : undefined}>
      <td>
        <span style={isChild ? { paddingLeft: 16 } : undefined}>
          <CategoryBadge category={move.category} />
          <Link href={detailPageHref} className="moves-table__move-link">
            {move.name}
          </Link>
        </span>
        {move.resonanceOnly === true && (
          <span
            style={{
              marginLeft: 4,
              fontSize: UI_SIZES.caption,
              color: UI_COLORS.resonance,
            }}
          >
            {RESONANCE_ONLY_LABEL.short}
          </span>
        )}
        {variantLabel !== undefined && (
          <span
            style={{
              marginLeft: 4,
              fontSize: UI_SIZES.caption,
              color: UI_COLORS.variant,
            }}
          >
            {variantLabel}
          </span>
        )}
        {move.note !== undefined && (
          <div style={{ fontSize: UI_SIZES.caption, color: UI_COLORS.mute }}>
            {move.note}
          </div>
        )}
      </td>
      <td className="moves-table__secondary">
        {moveGuardLevelShortLabel(move)}
        {airGroundJudgmentText !== undefined && (
          <span
            style={{
              marginLeft: 4,
              fontSize: UI_SIZES.caption,
              color: UI_COLORS.mute,
            }}
          >
            {airGroundJudgmentText}
          </span>
        )}
      </td>
      <td>{command}</td>
      <td className="moves-table__secondary">
        {move.attackType === undefined
          ? "-"
          : ATTACK_TYPE_META[move.attackType].label}
      </td>
      <td className="num">{move.strength ?? "-"}</td>
      <td className="num">{move.startup}</td>
      <td className="num">
        <FrameAdvantageText value={move.guardFrameAdvantage} />
      </td>
      <td className="num moves-table__secondary">
        {move.hitFrameAdvantage === undefined ? (
          "-"
        ) : (
          <FrameAdvantageText value={move.hitFrameAdvantage} />
        )}
      </td>
      <td className="num moves-table__secondary">
        {move.hitBreakdown !== undefined &&
        hitBreakdownDefines(move.hitBreakdown, "baseDamage")
          ? totalHitBreakdownDamage(move.hitBreakdown, "baseDamage")
          : formatDamageValue(move.baseDamage)}
      </td>
    </tr>
  );
};

/**
 * 技一覧テーブル。識別と最頻参照の項目のみを表示し、共鳴差分・特殊属性・説明など
 * 詳細情報は各技の詳細ページ (/characters/[id]/moves/[moveId]) に委譲する。
 * 副次列（判定・攻撃属性・ヒット硬直差）はスマホで CSS により非表示にする。
 * 強度は 1 桁で省スペースのため、スマホでも主要列として表示する。
 * ため・派生は親技の直下にぶら下げて表示。
 */
export const MovesTable = ({
  moves,
  characterId,
}: {
  moves: Move[];
  characterId: string;
}) => {
  if (moves.length === 0) {
    return <div className="empty">登録されている技がありません。</div>;
  }
  const groups = groupMovesByParent(moves);
  return (
    <>
      <div className="moves-table__toolbar">
        <StrengthHelpPopover />
      </div>
      <div className="moves-table__scroll">
        <table className="moves-table">
          <thead>
            <tr>
              <th>技名</th>
              <th className="moves-table__secondary">判定</th>
              <th>コマンド</th>
              <th className="moves-table__secondary">攻撃属性</th>
              <th className="num">強度</th>
              <th className="num">発生</th>
              <th className="num">ガード硬直差</th>
              <th className="num moves-table__secondary">ヒット硬直差</th>
              <th className="num moves-table__secondary">基礎ダメージ</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(({ parent, children }) => {
              const chargeMaxLevel = maxChargeLevel(children);
              return (
                <Fragment key={parent.id}>
                  <MoveRow move={parent} characterId={characterId} />
                  {children.map((child) => (
                    <MoveRow
                      key={child.id}
                      move={child}
                      characterId={characterId}
                      parentCommand={parent.command}
                      chargeMaxLevel={chargeMaxLevel}
                    />
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
