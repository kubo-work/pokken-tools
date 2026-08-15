import type { Move } from "@/types/move";
import { StrengthHelpPopover } from "@/components/StrengthHelpPopover";
import {
  MoveRow,
  type MoveRowProps,
} from "@/components/movesTable/MoveRow";
import { buildVariantRows } from "@/components/movesTable/variantRows";
import { maxChargeLevel } from "@/lib/moves/moveRules";
import { type MoveGroup, groupMovesByParent } from "@/lib/moves/grouping";

interface MoveVariantRowsProps
  extends Omit<MoveRowProps, "parentCommand" | "usagePhase" | "isJustInputRow"> {
  /** ため/派生のとき、コマンド組み立ての基準になる親技。親技自身では undefined。 */
  parentMove?: Move;
}

/** 1 技分の行。ジャスト入力・FP で性能が変わる技は、その直下に該当する行を続ける。 */
const MoveVariantRows = ({ parentMove, ...rowProps }: MoveVariantRowsProps) => {
  const { rows, fieldPhaseDiffKeys } = buildVariantRows(
    rowProps.move,
    parentMove,
  );
  return (
    <>
      {rows.map((row) => (
        <MoveRow
          {...rowProps}
          key={row.key}
          move={row.move}
          usagePhase={row.usagePhase}
          isJustInputRow={row.isJustInputRow}
          parentCommand={row.parentCommand}
          fieldPhaseDiffKeys={fieldPhaseDiffKeys}
        />
      ))}
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
      <MoveVariantRows move={group.parent} characterId={characterId} />
      {group.children.map((child) => (
        <MoveVariantRows
          key={child.id}
          move={child}
          characterId={characterId}
          parentMove={group.parent}
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
 * 強度は基本 1 桁で省スペースのため、スマホでも主要列として表示する
 * （ヒットごとに強度が変わる技だけは「5/3」のように併記するため幅を取る）。
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
