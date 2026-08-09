import type { ComparisonRow } from "@/components/MoveComparisonTable";
import {
  HIT_BREAKDOWN_DAMAGE_KEYS,
  type HitBreakdownDamageKey,
} from "@/lib/moves/moveEnums";
import {
  formatDamageValue,
  formatHitBreakdownDamage,
} from "@/lib/moves/moveFormat";
import { NO_VALUE_LABEL } from "@/lib/moves/moveLabels";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import type { Move } from "@/types/move";
import { ResonanceOverride } from "./rowHelpers";

/**
 * 技詳細ページ「ダメージ」表の行定義。
 * ダメージ系3項目と PCH値を扱い、ヒット内訳と単一値のどちらを表示するかもここで決める。
 */

/** DamageValue を持つダメージ行。renderCell が同型のため定義から生成する。 */
const DAMAGE_VALUE_ROW_DEFINITIONS: {
  header: string;
  key: HitBreakdownDamageKey;
}[] = [
  { header: "基礎ダメージ", key: "baseDamage" },
  { header: "削りダメージ", key: "chipDamage" },
  { header: "ガード削り値", key: "guardCrushValue" },
];

/**
 * 技（技単位・共鳴ヒット内訳のどちらか）がダメージ系フィールド
 * （baseDamage/chipDamage/guardCrushValue）をヒット内訳で定義しているか。
 * move-detail.tsx の hasAnyDamage 判定で使う（内訳のみの技でダメージセクションが消えるのを防ぐ）。
 */
export const hasBreakdownDamage = (move: Move): boolean =>
  HIT_BREAKDOWN_DAMAGE_KEYS.some(
    (key) =>
      hitBreakdownDefines(move.hitBreakdown, key) ||
      hitBreakdownDefines(move.resonance?.hitBreakdown, key),
  );

/** 共鳴のダメージ系1項目の表示テキスト。内訳優先、無ければ共鳴の単一値、どちらも無ければ undefined。 */
const resonanceDamageText = (
  move: Move,
  key: HitBreakdownDamageKey,
): string | undefined => {
  const resonanceHitBreakdown = move.resonance?.hitBreakdown;
  // hitBreakdownDefines は型述語ではないため、undefined を除く判定を別に書く必要がある
  // （formatHitBreakdownDamage は undefined を受け取れない）。
  if (
    resonanceHitBreakdown !== undefined &&
    hitBreakdownDefines(resonanceHitBreakdown, key)
  ) {
    return formatHitBreakdownDamage(resonanceHitBreakdown, key);
  }
  return move.resonance?.[key] !== undefined
    ? formatDamageValue(move.resonance[key])
    : undefined;
};

/**
 * ダメージ系1行分のセル。ヒット内訳がそのフィールドを定義していれば内訳表示（例: 50+45×3）、
 * 無ければ従来通り技単位の単一値。共鳴上書きも同じ優先順位（内訳→単一値）で判定する。
 */
const buildDamageValueRow = ({
  header,
  key,
}: (typeof DAMAGE_VALUE_ROW_DEFINITIONS)[number]): ComparisonRow => ({
  header,
  phaseDependentKeys: [key],
  renderCell: (move) => (
    <>
      {/* undefined 判定は resonanceDamageText と同じ理由で hitBreakdownDefines と別に必要。 */}
      {move.hitBreakdown !== undefined &&
      hitBreakdownDefines(move.hitBreakdown, key)
        ? formatHitBreakdownDamage(move.hitBreakdown, key)
        : formatDamageValue(move[key])}
      <ResonanceOverride value={resonanceDamageText(move, key)} />
    </>
  ),
});

/** ダメージ系の行。全変種で未入力ならセクションごと表示しない（move-detail.tsx 側 hasAnyDamage 参照）。 */
export const DAMAGE_ROWS: ComparisonRow[] = [
  ...DAMAGE_VALUE_ROW_DEFINITIONS.map(buildDamageValueRow),
  {
    header: "PCH値",
    phaseDependentKeys: ["phaseChangePoints"],
    renderCell: (move) => (
      <>
        {move.phaseChangePoints ?? NO_VALUE_LABEL}
        <ResonanceOverride value={move.resonance?.phaseChangePoints} />
      </>
    ),
  },
];
