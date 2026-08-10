import type { ComparisonRow } from "@/components/MoveComparisonTable";
import {
  HIT_BREAKDOWN_NUMERIC_KEYS,
  type HitBreakdownDamageKey,
} from "@/lib/moves/moveEnums";
import {
  formatDamageValue,
  formatHitBreakdownValue,
  formatPhaseChangePoints,
  formatTotalDamage,
} from "@/lib/moves/moveFormat";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import type { Move } from "@/types/move";
import { ResonanceOverride } from "./rowHelpers";

/**
 * 技詳細ページ「ダメージ」表の行定義。
 * ダメージ系3項目と PCH値を扱い、ヒット内訳と単一値のどちらを表示するかもここで決める。
 * PCH値はダメージ系と型が異なる（区切りの配列を持てる）ため、行の組み立てとフォーマッタを
 * ダメージ系（buildDamageRow）と PCH（PCH_ROW）で分けている。
 */

/**
 * ダメージ系1行分のセル。ヒット内訳がそのフィールドを定義していれば内訳表示（例: 50+45×3）、
 * 無ければ従来通り技単位の単一値。共鳴上書きも同じ優先順位（内訳→単一値）で判定する。
 */
const buildDamageRow = (key: HitBreakdownDamageKey): ComparisonRow => ({
  header: MOVE_FIELD_LABELS[key],
  phaseDependentKeys: [key],
  renderCell: (move) => (
    <>
      {move.hitBreakdown !== undefined &&
      hitBreakdownDefines(move.hitBreakdown, key)
        ? formatHitBreakdownValue(move.hitBreakdown, key)
        : formatDamageValue(move[key])}
      <ResonanceOverride value={resonanceDamageText(move, key)} />
    </>
  ),
});

/** 共鳴のダメージ系1項目の表示テキスト。内訳優先、無ければ共鳴の単一値、どちらも無ければ undefined。 */
const resonanceDamageText = (
  move: Move,
  key: HitBreakdownDamageKey,
): string | undefined => {
  const resonanceHitBreakdown = move.resonance?.hitBreakdown;
  if (
    resonanceHitBreakdown !== undefined &&
    hitBreakdownDefines(resonanceHitBreakdown, key)
  ) {
    return formatHitBreakdownValue(resonanceHitBreakdown, key);
  }
  return move.resonance?.[key] !== undefined
    ? formatDamageValue(move.resonance[key])
    : undefined;
};

/** PCH値の共鳴上書きテキスト。resonanceDamageText と同じ優先順位（内訳→単一値）。 */
const resonancePchText = (move: Move): string | undefined => {
  const resonanceHitBreakdown = move.resonance?.hitBreakdown;
  if (
    resonanceHitBreakdown !== undefined &&
    hitBreakdownDefines(resonanceHitBreakdown, "phaseChangePoints")
  ) {
    return formatHitBreakdownValue(resonanceHitBreakdown, "phaseChangePoints");
  }
  return move.resonance?.phaseChangePoints !== undefined
    ? formatPhaseChangePoints(move.resonance.phaseChangePoints)
    : undefined;
};

/** PCH値の行。区切りの配列を持てる点がダメージ系と異なるため、専用フォーマッタで表示する。 */
const PCH_ROW: ComparisonRow = {
  header: MOVE_FIELD_LABELS.phaseChangePoints,
  phaseDependentKeys: ["phaseChangePoints"],
  renderCell: (move) => (
    <>
      {move.hitBreakdown !== undefined &&
      hitBreakdownDefines(move.hitBreakdown, "phaseChangePoints")
        ? formatHitBreakdownValue(move.hitBreakdown, "phaseChangePoints")
        : formatPhaseChangePoints(move.phaseChangePoints)}
      <ResonanceOverride value={resonancePchText(move)} />
    </>
  ),
};

/**
 * 技（技単位・共鳴ヒット内訳のどちらか）がダメージ表の数値フィールド
 * （baseDamage/chipDamage/guardCrushValue/phaseChangePoints）をヒット内訳で定義しているか。
 * move-detail.tsx の hasAnyDamage 判定で使う（内訳のみの技でダメージセクションが消えるのを防ぐ）。
 */
export const hasBreakdownValueInDamageSection = (move: Move): boolean =>
  HIT_BREAKDOWN_NUMERIC_KEYS.some(
    (key) =>
      hitBreakdownDefines(move.hitBreakdown, key) ||
      hitBreakdownDefines(move.resonance?.hitBreakdown, key),
  );

/**
 * 合計ダメージの行。コンボ補正で perHit×hitCount やヒット内訳の総和と一致しない
 * 多段ヒット技のための実測値（totalDamage、詳細は types/move.ts 参照）で、
 * ヒット内訳を持たないため buildDamageRow の生成対象には含めず単独で定義する。
 */
const TOTAL_DAMAGE_ROW: ComparisonRow = {
  header: MOVE_FIELD_LABELS.totalDamage,
  // 基礎ダメージも依存項目に含めるのは、合計ダメージが多段ヒットの状態でしか表示されない
  // （単発になるフェイズでは resolveMove が落とす）ため。基礎ダメージだけがフェイズで
  // 変わる技でこれを申告しないと、DP の合計ダメージが FP のセルまで結合されて伸びる。
  phaseDependentKeys: ["totalDamage", "baseDamage"],
  renderCell: (move) => (
    <>
      {formatTotalDamage(move.totalDamage)}
      <ResonanceOverride value={move.resonance?.totalDamage} />
    </>
  ),
};

/**
 * ダメージ系の行。全変種で未入力ならセクションごと表示しない（move-detail.tsx 側 hasAnyDamage 参照）。
 * 合計ダメージは基礎ダメージの直後（実測値との対比がしやすい位置）に挿入し、PCH は既存の
 * 表示順（moveEnums の HIT_BREAKDOWN_NUMERIC_KEYS で最後）に合わせて末尾に置く。
 */
export const DAMAGE_ROWS: ComparisonRow[] = [
  buildDamageRow("baseDamage"),
  TOTAL_DAMAGE_ROW,
  buildDamageRow("chipDamage"),
  buildDamageRow("guardCrushValue"),
  PCH_ROW,
];
