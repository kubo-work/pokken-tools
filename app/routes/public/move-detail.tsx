import { Link } from "react-router";
import type { Route } from "./+types/move-detail";
import { getCharacter } from "@/lib/kv/getCharacters";
import { isKnownCharacterId } from "@/lib/characters/registry";
import { findMoveInCharacter } from "@/lib/moves/findMove";
import { groupMovesByParent } from "@/lib/moves/grouping";
import { getMovesByPhase } from "@/lib/moves/phaseMoves";
import { CategoryBadge } from "@/components/badges";
import {
  MoveComparisonTable,
  type ComparisonColumn,
} from "@/components/MoveComparisonTable";
import { PHASE_META, RESONANCE_ONLY_LABEL } from "@/lib/moves/moveLabels";
import { maxChargeLevel } from "@/lib/moves/moveRules";
import { ATTRIBUTE_ROWS } from "@/components/moveDetail/attributeRows";
import {
  DAMAGE_ROWS,
  hasBreakdownValueInDamageSection,
} from "@/components/moveDetail/damageRows";
import { FRAME_ROWS } from "@/components/moveDetail/frameRows";
import { buildVariantColumns } from "@/components/moveDetail/variantColumn";

/**
 * params から技を解決し、見つからなければ 404。親＋ため/派生をまとめた group を返す。
 * 子技 URL でも親グループに解決し、親＋ため/派生をまとめて表示する。
 */
export async function loader({ params }: Route.LoaderArgs) {
  const { id, moveId } = params;
  if (id === undefined || moveId === undefined || !isKnownCharacterId(id)) {
    throw new Response("Not Found", { status: 404 });
  }
  const character = await getCharacter(id);
  if (character === undefined) {
    throw new Response("Not Found", { status: 404 });
  }
  const found = findMoveInCharacter(character, moveId);
  if (found === undefined) {
    throw new Response("Not Found", { status: 404 });
  }
  const targetParentId = found.parent?.id ?? found.move.id;
  const phaseMoves = getMovesByPhase(character, found.phase);
  const group = groupMovesByParent(phaseMoves).find(
    (candidate) => candidate.parent.id === targetParentId,
  );
  if (group === undefined) {
    throw new Response("Not Found", { status: 404 });
  }
  return { id, characterName: character.name, phase: found.phase, group };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (loaderData === undefined) {
    return [{ name: "robots", content: "noindex, nofollow" }];
  }
  // 子技 URL でも親詳細に集約されるため、タイトルは親技名で付ける。
  return [
    {
      title: `${loaderData.group.parent.name} | ${loaderData.characterName} | ポッ拳フレーム表`,
    },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

/** 変種ごとの注記・説明を、テキストを持つものだけ並べる。 */
const MoveDescriptions = ({ columns }: { columns: ComparisonColumn[] }) => (
  <>
    {columns.map(({ key, move, label }) => {
      if (move.note === undefined && move.description === undefined) {
        return null;
      }
      return (
        <div key={key} className="move-detail__desc-block">
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

export default function MoveDetailPage({ loaderData }: Route.ComponentProps) {
  const { id, characterName, phase, group } = loaderData;
  const parentMove = group.parent;
  const chargeMaxLevel = maxChargeLevel(group.children);
  const columns: ComparisonColumn[] = [parentMove, ...group.children].flatMap(
    (move) => buildVariantColumns(move, parentMove, chargeMaxLevel),
  );
  const hasAnyText = columns.some(
    ({ move }) => move.note !== undefined || move.description !== undefined,
  );
  const hasAnyDamage = columns.some(
    ({ move }) =>
      move.baseDamage !== undefined ||
      move.totalDamage !== undefined ||
      move.chipDamage !== undefined ||
      move.guardCrushValue !== undefined ||
      move.phaseChangePoints !== undefined ||
      hasBreakdownValueInDamageSection(move),
  );

  return (
    <div className="move-detail">
      <Link className="move-detail__back" to={`/characters/${id}`}>
        ← {characterName} の技一覧へ
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
          {/* 技一覧の子技リンク（#変種ID）の着地点。アンカーはこのテーブルだけに付ける。 */}
          <MoveComparisonTable
            columns={columns}
            rows={FRAME_ROWS}
            resonanceOnlyLabel={RESONANCE_ONLY_LABEL.full}
            withColumnAnchors
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
            rows={ATTRIBUTE_ROWS}
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
