import type { ComparisonRow } from "@/components/MoveComparisonTable";
import {
  hitBreakdownCategoricalLines,
  moveAirGroundJudgmentLines,
  moveGuardLevelLines,
} from "@/lib/moves/moveCategoricalDisplay";
import {
  resonanceFlinchLabel,
  specialAttributeLabel,
} from "@/lib/moves/moveFormat";
import {
  ATTACK_TYPE_META,
  GUARD_LEVEL_META,
  NO_VALUE_LABEL,
} from "@/lib/moves/moveLabels";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import { formatMoveCommand } from "@/lib/moves/command";
import type { Move } from "@/types/move";
import { ResonanceOverride } from "./rowHelpers";

/**
 * 技詳細ページ「判定・属性」表の行定義。
 * コマンド・判定・空地・攻撃属性・強度・共鳴怯ませ・特殊属性を扱う。
 */

/** テキストの複数値を区切って併記する際のセパレータ。「貫通 / アーマー」のような表記に使う。 */
const INLINE_LIST_SEPARATOR = " / ";

/**
 * 判定系（判定・空地）の表示行をセル内に描画する。ヒット内訳で複数行になる場合は
 * グループごとに行を分ける。1行だけならインラインのまま（共鳴の→を同じ行に併記するため）。
 */
const CategoricalLines = ({ lines }: { lines: string[] }) => {
  if (lines.length === 0) {
    return <>{NO_VALUE_LABEL}</>;
  }
  if (lines.length === 1) {
    return <>{lines[0]}</>;
  }
  return (
    <>
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </>
  );
};

const attackTypeLabel = (move: Move): string =>
  move.attackType === undefined
    ? NO_VALUE_LABEL
    : ATTACK_TYPE_META[move.attackType].label;

const specialAttributesLabel = (move: Move): string =>
  move.specialAttributes === undefined || move.specialAttributes.length === 0
    ? NO_VALUE_LABEL
    : move.specialAttributes
        .map((attribute) => specialAttributeLabel(attribute, move))
        .join(INLINE_LIST_SEPARATOR);

/** ため/派生のコマンドは親コマンドを基準に組み立てる。親自身は親コマンドなし。 */
const variantCommand = (move: Move, parentMove: Move): string =>
  formatMoveCommand(
    move,
    move.id === parentMove.id ? undefined : parentMove.command,
  );

/**
 * 共鳴のヒット内訳が判定系フィールドを定義していれば、「→」の後にインラインで併記するため
 * 行に分けず INLINE_LIST_SEPARATOR で連結して返す。定義していなければ undefined。
 * 技単位の代表値へのフォールバックは呼び出し側が個別に行う（guardLevel は
 * ResonanceOverride が単一値も持つが、airGroundJudgment は持たないため）。
 */
const resonanceHitBreakdownCategoricalText = (
  move: Move,
  key: "guardLevel" | "airGroundJudgment",
): string | undefined => {
  const resonanceHitBreakdown = move.resonance?.hitBreakdown;
  return resonanceHitBreakdown !== undefined &&
    hitBreakdownDefines(resonanceHitBreakdown, key)
    ? hitBreakdownCategoricalLines(resonanceHitBreakdown, key).join(
        INLINE_LIST_SEPARATOR,
      )
    : undefined;
};

/** 共鳴の判定（guardLevel）の表示テキスト。内訳優先、無ければ共鳴の単一値、どちらも無ければ undefined。 */
const resonanceGuardLevelText = (move: Move): string | undefined =>
  resonanceHitBreakdownCategoricalText(move, "guardLevel") ??
  (move.resonance?.guardLevel !== undefined
    ? GUARD_LEVEL_META[move.resonance.guardLevel].label
    : undefined);

/**
 * 共鳴の空・地判定の表示テキスト。ResonanceOverride は単一値の airGroundJudgment を
 * 持たないため、ヒット内訳で定義されている場合のみ表示する。
 */
const resonanceAirGroundJudgmentText = (move: Move): string | undefined =>
  resonanceHitBreakdownCategoricalText(move, "airGroundJudgment");

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
        <CategoricalLines lines={moveGuardLevelLines(move)} />
        <ResonanceOverride value={resonanceGuardLevelText(move)} />
      </>
    ),
  },
  {
    header: "空・地",
    renderCell: (move) => (
      <>
        <CategoricalLines lines={moveAirGroundJudgmentLines(move)} />
        <ResonanceOverride value={resonanceAirGroundJudgmentText(move)} />
      </>
    ),
  },
  { header: "攻撃属性", renderCell: (move) => attackTypeLabel(move) },
  {
    header: "強度",
    renderCell: (move) => (
      <>
        {move.strength ?? NO_VALUE_LABEL}
        <ResonanceOverride value={move.resonance?.strength} />
      </>
    ),
  },
  {
    header: "共鳴怯ませ",
    renderCell: (move) => resonanceFlinchLabel(move.resonanceFlinch),
  },
  { header: "特殊", renderCell: (move) => specialAttributesLabel(move) },
];
