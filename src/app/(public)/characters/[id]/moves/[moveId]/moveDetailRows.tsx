import type { ReactNode } from "react";
import { FrameAdvantageText } from "@/components/FrameAdvantageText";
import { FrameNumber } from "@/components/FrameNumber";
import type { ComparisonRow } from "@/components/MoveComparisonTable";
import {
  AIR_GROUND_JUDGMENT_META,
  ATTACK_TYPE_META,
  GUARD_LEVEL_META,
  MOVE_VARIANT_META,
  childVariantLabel,
  formatDamageValue,
  resonanceFlinchLabel,
  specialAttributeLabel,
} from "@/lib/meta";
import { formatMoveCommand } from "@/lib/moves/command";
import type { Move } from "@/types/move";

/**
 * 技詳細ページ (page.tsx) の比較テーブル行定義。
 * ページ本体はデータ取得と画面構成に専念させ、行の描画ロジックはここに集約する。
 */

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
export const variantColumnLabel = (
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
export const FRAME_ROWS: ComparisonRow[] = [
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

/** DamageValue を持つダメージ行。renderCell が同型のため定義から生成する。 */
const DAMAGE_VALUE_ROW_DEFINITIONS: {
  header: string;
  key: "baseDamage" | "chipDamage" | "guardCrushValue";
}[] = [
  { header: "基礎ダメージ", key: "baseDamage" },
  { header: "削りダメージ", key: "chipDamage" },
  { header: "ガード削り値", key: "guardCrushValue" },
];

const buildDamageValueRow = ({
  header,
  key,
}: (typeof DAMAGE_VALUE_ROW_DEFINITIONS)[number]): ComparisonRow => ({
  header,
  renderCell: (move) => (
    <>
      {formatDamageValue(move[key])}
      {move.resonance?.[key] !== undefined && (
        <ResonanceArrow>{formatDamageValue(move.resonance[key])}</ResonanceArrow>
      )}
    </>
  ),
});

/** ダメージ系の行。全変種で未入力ならセクションごと表示しない（page 側 hasAnyDamage 参照）。 */
export const DAMAGE_ROWS: ComparisonRow[] = [
  ...DAMAGE_VALUE_ROW_DEFINITIONS.map(buildDamageValueRow),
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
export const buildAttributeRows = (parentMove: Move): ComparisonRow[] => [
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
