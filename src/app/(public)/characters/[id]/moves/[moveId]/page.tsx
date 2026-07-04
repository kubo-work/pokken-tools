import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacter } from "@/lib/kv/getCharacters";
import { isKnownCharacterId } from "@/lib/characters/registry";
import { findMoveInCharacter } from "@/lib/moves/findMove";
import { formatMoveCommand } from "@/lib/moves/command";
import { groupMovesByParent } from "@/lib/moves/grouping";
import { CategoryBadge } from "@/components/badges";
import { FrameAdvantageText } from "@/components/FrameAdvantageText";
import { FrameNumber } from "@/components/FrameNumber";
import {
  MoveComparisonTable,
  type ComparisonColumn,
  type ComparisonRow,
} from "@/components/MoveComparisonTable";
import {
  AIR_GROUND_JUDGMENT_META,
  ATTACK_TYPE_META,
  GUARD_LEVEL_META,
  MOVE_VARIANT_META,
  PHASE_META,
  RESONANCE_ONLY_LABEL,
  childVariantLabel,
  formatDamageValue,
  maxChargeLevel,
  resonanceFlinchLabel,
  specialAttributeLabel,
} from "@/lib/meta";
import type { Move } from "@/types/move";

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

const guardLevelLabel = (move: Move): string =>
  move.guardLevel === null ? "-" : GUARD_LEVEL_META[move.guardLevel].label;

const attackTypeLabel = (move: Move): string =>
  move.attackType === undefined ? "-" : ATTACK_TYPE_META[move.attackType].label;

const specialAttributesLabel = (move: Move): string =>
  move.specialAttributes === undefined || move.specialAttributes.length === 0
    ? "-"
    : move.specialAttributes
        .map((attribute) => specialAttributeLabel(attribute, move))
        .join(" / ");

const airGroundJudgmentLabel = (move: Move): string =>
  move.airGroundJudgment === undefined
    ? "-"
    : AIR_GROUND_JUDGMENT_META[move.airGroundJudgment].label;

/** 共鳴中の上書き値を amber の「→値」でセル内に併記する。 */
const ResonanceArrow = ({ children }: { children: ReactNode }) => (
  <span className="move-detail__override"> →{children}</span>
);

/** 変種の列ラベル。親は「通常」、子はため段階/派生のラベルを使う。 */
const variantColumnLabel = (
  move: Move,
  parentMove: Move,
  chargeMaxLevel: number,
): string => {
  if (move.id === parentMove.id) {
    return MOVE_VARIANT_META.normal.label;
  }
  // 親以外は必ず子技（charge/derivative）なので childVariantLabel は値を返すが、
  // 型を string に確定させるため variant 既定ラベルでフォールバックする。
  return (
    childVariantLabel(move, chargeMaxLevel) ??
    MOVE_VARIANT_META[move.variant ?? "normal"].label
  );
};

/** ため/派生のコマンドは親コマンドを基準に組み立てる。親自身は親コマンドなし。 */
const variantCommand = (move: Move, parentMove: Move): string =>
  formatMoveCommand(
    move,
    move.id === parentMove.id ? undefined : parentMove.command,
  );

/** 発生・ガード硬直差・ヒット硬直差。変種に依存しない静的な行定義。 */
const FRAME_ROWS: ComparisonRow[] = [
  {
    header: "発生",
    renderCell: (move) => (
      <>
        {move.startup}
        {move.resonance?.startup !== undefined && (
          <ResonanceArrow>{move.resonance.startup}</ResonanceArrow>
        )}
      </>
    ),
  },
  {
    header: "ガード硬直差",
    renderCell: (move) => (
      <>
        <FrameAdvantageText value={move.guardFrameAdvantage} />
        {move.resonance?.guardFrameAdvantage !== undefined && (
          <ResonanceArrow>
            <FrameNumber value={move.resonance.guardFrameAdvantage} />
          </ResonanceArrow>
        )}
      </>
    ),
  },
  {
    header: "ヒット硬直差",
    renderCell: (move) => (
      <>
        {move.hitFrameAdvantage === undefined ? (
          "-"
        ) : (
          <FrameAdvantageText value={move.hitFrameAdvantage} />
        )}
        {move.resonance?.hitFrameAdvantage !== undefined && (
          <ResonanceArrow>
            <FrameNumber value={move.resonance.hitFrameAdvantage} />
          </ResonanceArrow>
        )}
      </>
    ),
  },
];

/** ダメージ系の行。全変種で未入力ならセクションごと表示しない（hasAnyDamage 参照）。 */
const DAMAGE_ROWS: ComparisonRow[] = [
  {
    header: "基礎ダメージ",
    renderCell: (move) => (
      <>
        {formatDamageValue(move.baseDamage)}
        {move.resonance?.baseDamage !== undefined && (
          <ResonanceArrow>
            {formatDamageValue(move.resonance.baseDamage)}
          </ResonanceArrow>
        )}
      </>
    ),
  },
  {
    header: "削りダメージ",
    renderCell: (move) => (
      <>
        {formatDamageValue(move.chipDamage)}
        {move.resonance?.chipDamage !== undefined && (
          <ResonanceArrow>
            {formatDamageValue(move.resonance.chipDamage)}
          </ResonanceArrow>
        )}
      </>
    ),
  },
  {
    header: "ガード削り値",
    renderCell: (move) => (
      <>
        {formatDamageValue(move.guardCrushValue)}
        {move.resonance?.guardCrushValue !== undefined && (
          <ResonanceArrow>
            {formatDamageValue(move.resonance.guardCrushValue)}
          </ResonanceArrow>
        )}
      </>
    ),
  },
  {
    header: "PCH値",
    renderCell: (move) => (
      <>
        {move.phaseChangePoints ?? "-"}
        {move.resonance?.phaseChangePoints !== undefined && (
          <ResonanceArrow>{move.resonance.phaseChangePoints}</ResonanceArrow>
        )}
      </>
    ),
  },
];

/** コマンドは親コマンド基準で変わるため parentMove を受けて行を組み立てる。 */
const buildAttributeRows = (parentMove: Move): ComparisonRow[] => [
  {
    header: "コマンド",
    renderCell: (move) => variantCommand(move, parentMove),
  },
  {
    header: "判定",
    renderCell: (move) => (
      <>
        {guardLevelLabel(move)}
        {move.resonance?.guardLevel !== undefined && (
          <ResonanceArrow>
            {GUARD_LEVEL_META[move.resonance.guardLevel].label}
          </ResonanceArrow>
        )}
      </>
    ),
  },
  { header: "空・地", renderCell: (move) => airGroundJudgmentLabel(move) },
  { header: "攻撃属性", renderCell: (move) => attackTypeLabel(move) },
  {
    header: "強度",
    renderCell: (move) => (
      <>
        {move.strength ?? "-"}
        {move.resonance?.strength !== undefined && (
          <ResonanceArrow>{move.resonance.strength}</ResonanceArrow>
        )}
      </>
    ),
  },
  {
    header: "共鳴怯ませ",
    renderCell: (move) => resonanceFlinchLabel(move.resonanceFlinch),
  },
  { header: "特殊", renderCell: (move) => specialAttributesLabel(move) },
];

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

      {hasAnyText && (
        <section className="move-detail__section">
          <h2 className="move-detail__section-title">説明</h2>
          <MoveDescriptions columns={columns} />
        </section>
      )}
    </div>
  );
}
