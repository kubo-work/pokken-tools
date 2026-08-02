import type { ReactNode } from "react";
import { Link } from "react-router";
import type { Move } from "@/types/move";
import { CategoryBadge } from "@/components/badges";
import { FrameAdvantageText } from "@/components/FrameAdvantageText";
import { FrameNumber } from "@/components/FrameNumber";
import { StrengthHelpPopover } from "@/components/StrengthHelpPopover";
import {
  ATTACK_TYPE_META,
  JUST_INPUT_LABEL,
  POKEMON_MOVE_CANCEL_LABEL,
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
import {
  type MoveGroup,
  groupMovesByParent,
  isChildMove,
} from "@/lib/moves/grouping";
import {
  justInputColumnKey,
  resolveJustInputMove,
} from "@/lib/moves/resolveMove";
import { UI_COLORS, UI_SIZES } from "@/lib/uiTokens";

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

interface MoveRowProps {
  move: Move;
  characterId: string;
  parentCommand?: string;
  /** 同じ親グループ内のため段階の最大値。ため子技のラベルを「ためMAX」にするか判定する。 */
  chargeMaxLevel?: number;
  /** true なら「元の技のジャスト入力版」の行として、通常行より1段深く字下げしバッジを付ける。 */
  isJustInputRow?: boolean;
}

/** 技名セルの字下げ段数。子技で1段、ジャスト入力行でさらに1段下げる。 */
const rowIndentDepth = (isChild: boolean, isJustInputRow: boolean): number =>
  (isChild ? 1 : 0) + (isJustInputRow ? 1 : 0);

/** 技名の右に並ぶ小さなラベル（ジャスト・共鳴専用・ため/派生・空地判定）の共通スタイル。 */
const InlineTag = ({ color, children }: { color: string; children: ReactNode }) => (
  <span
    style={{ marginLeft: 4, fontSize: UI_SIZES.caption, color }}
  >
    {children}
  </span>
);

/** ため/派生・ジャスト入力は親の詳細ページに集約されているため、該当列へのアンカー付きで飛ばす。 */
const detailPageHrefOf = (
  move: Move,
  characterId: string,
  isChild: boolean,
  isJustInputRow: boolean,
): string => {
  const moveId = isChild ? (move.parentMoveId ?? move.id) : move.id;
  const path = `/characters/${characterId}/moves/${moveId}`;
  if (!isChild && !isJustInputRow) {
    return path;
  }
  const columnAnchor = isJustInputRow ? justInputColumnKey(move.id) : move.id;
  return `${path}#${columnAnchor}`;
};

interface MoveNameCellProps {
  move: Move;
  characterId: string;
  isChild: boolean;
  isJustInputRow: boolean;
  /** ため段階/派生のラベル。通常技では undefined。 */
  variantLabel: string | undefined;
}

/** 技名セル。詳細ページへのリンクに、条件・変種を表すラベルと注記を添える。 */
const MoveNameCell = ({
  move,
  characterId,
  isChild,
  isJustInputRow,
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
          to={detailPageHrefOf(move, characterId, isChild, isJustInputRow)}
          className="moves-table__move-link"
        >
          {move.name}
        </Link>
      </span>
      {isJustInputRow && (
        <InlineTag color={UI_COLORS.justInput}>{JUST_INPUT_LABEL.short}</InlineTag>
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

/** 強度・発生・硬直差・基礎ダメージの数値セル群。技名まわりと違い状態に依存しない。 */
const MoveFrameCells = ({ move }: { move: Move }) => (
  <>
    <td className="num">{move.strength ?? "-"}</td>
    <td className="num">{move.startup}</td>
    <td className="num">
      <FrameAdvantageText value={move.guardFrameAdvantage} />
      <PokemonMoveCancelNote
        value={move.guardFrameAdvantageOnPokemonMoveCancel}
      />
    </td>
    <td className="num moves-table__secondary">
      {move.hitFrameAdvantage === undefined ? (
        "-"
      ) : (
        <FrameAdvantageText value={move.hitFrameAdvantage} />
      )}
      <PokemonMoveCancelNote value={move.hitFrameAdvantageOnPokemonMoveCancel} />
    </td>
    <td className="num moves-table__secondary">
      {move.hitBreakdown !== undefined &&
      hitBreakdownDefines(move.hitBreakdown, "baseDamage")
        ? totalHitBreakdownDamage(move.hitBreakdown, "baseDamage")
        : formatDamageValue(move.baseDamage)}
    </td>
  </>
);

const MoveRow = ({
  move,
  characterId,
  parentCommand,
  chargeMaxLevel = 0,
  isJustInputRow = false,
}: MoveRowProps) => {
  const isChild = isChildMove(move);
  const command = formatMoveCommand(move, parentCommand);
  const airGroundJudgmentText = moveAirGroundJudgmentLabel(move);
  return (
    <tr className={isChild ? "moves-table__child" : undefined}>
      <MoveNameCell
        move={move}
        characterId={characterId}
        isChild={isChild}
        isJustInputRow={isJustInputRow}
        variantLabel={childVariantLabel(move, chargeMaxLevel)}
      />
      <td className="moves-table__secondary">
        {moveGuardLevelShortLabel(move)}
        {airGroundJudgmentText !== undefined && (
          <InlineTag color={UI_COLORS.mute}>{airGroundJudgmentText}</InlineTag>
        )}
      </td>
      <td>{command}</td>
      <td className="moves-table__secondary">
        {move.attackType === undefined
          ? "-"
          : ATTACK_TYPE_META[move.attackType].label}
      </td>
      <MoveFrameCells move={move} />
    </tr>
  );
};

/** 1 技分の行。ジャスト入力で性能が変わる技は、その直下にジャスト入力版の行を続ける。 */
const MoveRowWithJustInput = (props: MoveRowProps) => {
  const justInputMove = resolveJustInputMove(props.move);
  return (
    <>
      <MoveRow {...props} />
      {justInputMove !== undefined && (
        <MoveRow {...props} move={justInputMove} isJustInputRow />
      )}
    </>
  );
};

/** 親技グループ 1 つ分（親技 → ため/派生）の行。 */
const MoveGroupRows = ({
  group,
  characterId,
}: {
  group: MoveGroup;
  characterId: string;
}) => {
  const chargeMaxLevel = maxChargeLevel(group.children);
  return (
    <>
      <MoveRowWithJustInput move={group.parent} characterId={characterId} />
      {group.children.map((child) => (
        <MoveRowWithJustInput
          key={child.id}
          move={child}
          characterId={characterId}
          parentCommand={group.parent.command}
          chargeMaxLevel={chargeMaxLevel}
        />
      ))}
    </>
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
            {groups.map((group) => (
              <MoveGroupRows
                key={group.parent.id}
                group={group}
                characterId={characterId}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
