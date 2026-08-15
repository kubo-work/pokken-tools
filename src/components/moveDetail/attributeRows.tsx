import type { ComparisonRow } from "@/components/MoveComparisonTable";
import type { HitBreakdownCategoricalKey } from "@/lib/moves/moveEnums";
import {
  hitBreakdownCategoricalLines,
  moveAirGroundJudgmentLines,
  moveAttackTypeLines,
  moveGuardLevelLines,
  moveResonanceFlinchLines,
  moveStrengthLines,
} from "@/lib/moves/moveCategoricalDisplay";
import { specialAttributeLabel } from "@/lib/moves/moveFormat";
import {
  GUARD_LEVEL_META,
  MOVE_FIELD_LABELS,
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

const specialAttributesLabel = (move: Move): string =>
  move.specialAttributes === undefined || move.specialAttributes.length === 0
    ? NO_VALUE_LABEL
    : move.specialAttributes
        .map((attribute) => specialAttributeLabel(attribute, move))
        .join(INLINE_LIST_SEPARATOR);

/**
 * 共鳴のヒット内訳が判定系フィールドを定義していれば、「→」の後にインラインで併記するため
 * 行に分けず INLINE_LIST_SEPARATOR で連結して返す。定義していなければ undefined。
 * 技単位の代表値へのフォールバックは呼び出し側が個別に行う（guardLevel だけは
 * MoveOverride が単一値も持ち、airGroundJudgment と resonanceFlinch は持たないため）。
 */
const resonanceHitBreakdownCategoricalText = (
  move: Move,
  key: HitBreakdownCategoricalKey,
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

/**
 * 共鳴の共鳴怯ませの表示テキスト。共鳴怯ませは単一値では上書きできない（MoveOverride が
 * 持たない）ため、空・地判定と同じくヒット内訳で定義されている場合のみ表示する。
 */
const resonanceFlinchOverrideText = (move: Move): string | undefined =>
  resonanceHitBreakdownCategoricalText(move, "resonanceFlinch");

/**
 * 共鳴の攻撃属性の表示テキスト。attackType は上書き層を持たない（Move にのみ存在）ため、
 * 空・地判定と同じくヒット内訳で定義されている場合のみ表示する。
 */
const resonanceAttackTypeText = (move: Move): string | undefined =>
  resonanceHitBreakdownCategoricalText(move, "attackType");

/**
 * 共鳴の強度の表示。内訳優先、無ければ共鳴の単一値、どちらも無ければ undefined。
 * ResonanceOverride は数値もそのまま描けるため、単一値は文字列化せずに渡す。
 */
const resonanceStrength = (move: Move): string | number | undefined =>
  resonanceHitBreakdownCategoricalText(move, "strength") ??
  move.resonance?.strength;

/**
 * 判定・属性表の行。ため/派生のコマンドは親コマンドを基準に組み立てるが、その親コマンドは
 * 列ごと（フェイズごと）に変わりうるため、列が持つ値を使う。
 */
export const ATTRIBUTE_ROWS: ComparisonRow[] = [
  {
    header: "コマンド",
    // フェイズで入力そのものが変わる技があるため、唯一 FP 差分を持ちうる属性行。
    phaseDependentKeys: ["command"],
    renderCell: (move, column) => formatMoveCommand(move, column.parentCommand),
  },
  {
    header: "判定",
    // guardLevel はフェイズで変わらない（FieldPhaseOverride に無い）。ヒット内訳経由の変化は
    // 結合判定側がまとめて扱うため、ここでは挙げない。
    phaseDependentKeys: [],
    renderCell: (move) => (
      <>
        <CategoricalLines lines={moveGuardLevelLines(move)} />
        <ResonanceOverride value={resonanceGuardLevelText(move)} />
      </>
    ),
  },
  {
    header: "空・地",
    // airGroundJudgment はフェイズで変わらない（判定と同じ扱い）。
    phaseDependentKeys: [],
    renderCell: (move) => (
      <>
        <CategoricalLines lines={moveAirGroundJudgmentLines(move)} />
        <ResonanceOverride value={resonanceAirGroundJudgmentText(move)} />
      </>
    ),
  },
  {
    header: "攻撃属性",
    // attackType はフェイズで変わらない（FieldPhaseOverride に無い）。判定と同じ扱い。
    phaseDependentKeys: [],
    renderCell: (move) => (
      <>
        <CategoricalLines lines={moveAttackTypeLines(move)} />
        <ResonanceOverride value={resonanceAttackTypeText(move)} />
      </>
    ),
  },
  {
    header: "強度",
    phaseDependentKeys: ["strength"],
    renderCell: (move) => (
      <>
        <CategoricalLines lines={moveStrengthLines(move)} />
        <ResonanceOverride value={resonanceStrength(move)} />
      </>
    ),
  },
  {
    header: MOVE_FIELD_LABELS.resonanceFlinch,
    // 共鳴怯ませはフェイズで変わらない（FieldPhaseOverride に無い）。判定と同じ扱い。
    phaseDependentKeys: [],
    renderCell: (move) => (
      <>
        <CategoricalLines lines={moveResonanceFlinchLines(move)} />
        <ResonanceOverride value={resonanceFlinchOverrideText(move)} />
      </>
    ),
  },
  {
    header: "特殊",
    phaseDependentKeys: [],
    renderCell: (move) => specialAttributesLabel(move),
  },
];
