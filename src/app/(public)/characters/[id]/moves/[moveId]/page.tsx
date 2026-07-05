import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacter } from "@/lib/kv/getCharacters";
import { isKnownCharacterId } from "@/lib/characters/registry";
import { findMoveInCharacter } from "@/lib/moves/findMove";
import { groupMovesByParent } from "@/lib/moves/grouping";
import { CategoryBadge } from "@/components/badges";
import {
  MoveComparisonTable,
  type ComparisonColumn,
} from "@/components/MoveComparisonTable";
import {
  PHASE_META,
  RESONANCE_ONLY_LABEL,
  maxChargeLevel,
} from "@/lib/meta";
import {
  DAMAGE_ROWS,
  FRAME_ROWS,
  buildAttributeRows,
  variantColumnLabel,
} from "./moveDetailRows";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; moveId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id, moveId } = await params;
  if (!isKnownCharacterId(id)) {
    return {};
  }
  const character = await getCharacter(id);
  if (character === undefined) {
    return {};
  }
  const found = findMoveInCharacter(character, moveId);
  if (found === undefined) {
    return {};
  }
  // 子技 URL でも親技名でタイトルを付ける（ページは親に集約されるため）。
  const titleMove = found.parent ?? found.move;
  return { title: `${titleMove.name} | ${character.name} | ポッ拳フレーム表` };
}

/** 変種ごとの注記・説明を、テキストを持つものだけ並べる。 */
const MoveDescriptions = ({
  columns,
}: {
  columns: ComparisonColumn[];
}) => (
  <>
    {columns.map(({ move, label }) => {
      if (move.note === undefined && move.description === undefined) {
        return null;
      }
      return (
        <div key={move.id} className="move-detail__desc-block">
          <h3 className="move-detail__desc-label">{label}</h3>
          {move.note !== undefined && (
            <p className="move-detail__note">{move.note}</p>
          )}
          {move.description !== undefined && (
            <p className="move-detail__description">{move.description}</p>
          )}
        </div>
      );
    })}
  </>
);

/** params から技を解決し、見つからなければ notFound。親＋ため/派生をまとめた group を返す。 */
const loadMoveDetail = async (params: Params) => {
  const { id, moveId } = await params;
  if (!isKnownCharacterId(id)) {
    notFound();
  }
  const character = await getCharacter(id);
  if (character === undefined) {
    notFound();
  }
  const found = findMoveInCharacter(character, moveId);
  if (found === undefined) {
    notFound();
  }
  // 子技でも親グループに解決して、親＋ため/派生をまとめて表示する。
  const targetParentId = found.parent?.id ?? found.move.id;
  const phaseMoves =
    found.phase === "duel" ? character.duelMoves : character.fieldMoves;
  const group = groupMovesByParent(phaseMoves).find(
    (candidate) => candidate.parent.id === targetParentId,
  );
  if (group === undefined) {
    notFound();
  }
  return { id, character, phase: found.phase, group };
};

export default async function MoveDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id, character, phase, group } = await loadMoveDetail(params);
  const parentMove = group.parent;
  const chargeMaxLevel = maxChargeLevel(group.children);
  const columns: ComparisonColumn[] = [parentMove, ...group.children].map(
    (move) => ({
      move,
      label: variantColumnLabel(move, parentMove, chargeMaxLevel),
    }),
  );
  const hasAnyText = columns.some(
    ({ move }) => move.note !== undefined || move.description !== undefined,
  );
  const hasAnyDamage = columns.some(
    ({ move }) =>
      move.baseDamage !== undefined ||
      move.chipDamage !== undefined ||
      move.guardCrushValue !== undefined ||
      move.phaseChangePoints !== undefined,
  );

  return (
    <div className="move-detail">
      <Link className="move-detail__back" href={`/characters/${id}`}>
        ← {character.name} の技一覧へ
      </Link>

      <header className="move-detail__head">
        <h1 className="move-detail__title">
          <CategoryBadge category={parentMove.category} />
          <span>{parentMove.name}</span>
          {parentMove.resonanceOnly === true && (
            <span className="move-detail__tag move-detail__tag--resonance">
              {RESONANCE_ONLY_LABEL.full}
            </span>
          )}
        </h1>
        <p className="move-detail__phase">{PHASE_META[phase].label}</p>
      </header>

      {/* PC ではテーブル群を横並びにして余白を活かす（狭幅では flex-wrap で縦積み） */}
      <div className="move-detail__columns">
        <section className="move-detail__section">
          <h2 className="move-detail__section-title">フレームデータ</h2>
          <MoveComparisonTable
            columns={columns}
            rows={FRAME_ROWS}
            resonanceOnlyLabel={RESONANCE_ONLY_LABEL.full}
          />
        </section>

        {hasAnyDamage && (
          <section className="move-detail__section">
            <h2 className="move-detail__section-title">ダメージ</h2>
            <MoveComparisonTable
              columns={columns}
              rows={DAMAGE_ROWS}
              resonanceOnlyLabel={RESONANCE_ONLY_LABEL.full}
            />
          </section>
        )}

        <section className="move-detail__section">
          <h2 className="move-detail__section-title">判定・属性</h2>
          <MoveComparisonTable
            columns={columns}
            rows={buildAttributeRows(parentMove)}
            align="text"
          />
        </section>
      </div>

      {hasAnyText && (
        <section className="move-detail__section">
          <h2 className="move-detail__section-title">説明</h2>
          <MoveDescriptions columns={columns} />
        </section>
      )}
    </div>
  );
}
