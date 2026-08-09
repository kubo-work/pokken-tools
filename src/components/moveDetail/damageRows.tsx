import type { ComparisonRow } from "@/components/MoveComparisonTable";
import {
  HIT_BREAKDOWN_NUMERIC_KEYS,
  type HitBreakdownNumericKey,
} from "@/lib/moves/moveEnums";
import {
  formatDamageValue,
  formatHitBreakdownValue,
} from "@/lib/moves/moveFormat";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import type { Move } from "@/types/move";
import { ResonanceOverride } from "./rowHelpers";

/**
 * 技詳細ページ「ダメージ」表の行定義。
 * ダメージ系3項目と PCH値を扱い、ヒット内訳と単一値のどちらを表示するかもここで決める。
 */

/**
 * 数値行の定義。PCH値は技単位では number、ダメージ系は DamageValue と型は違うが、
 * 「内訳があれば内訳、無ければ単一値」という表示の解決は同じなので同じ生成関数に乗せる。
 * 見出しは管理画面の入力欄と同じ文言を使うため、キー集合から導出する。
 */
const HIT_BREAKDOWN_NUMERIC_ROWS: {
  header: string;
  key: HitBreakdownNumericKey;
}[] = HIT_BREAKDOWN_NUMERIC_KEYS.map((key) => ({
  header: MOVE_FIELD_LABELS[key],
  key,
}));

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

/** 共鳴の数値1項目の表示テキスト。内訳優先、無ければ共鳴の単一値、どちらも無ければ undefined。 */
const resonanceNumericText = (
  move: Move,
  key: HitBreakdownNumericKey,
): string | undefined => {
  const resonanceHitBreakdown = move.resonance?.hitBreakdown;
  // hitBreakdownDefines は型述語ではないため、undefined を除く判定を別に書く必要がある
  // （formatHitBreakdownValue は undefined を受け取れない）。
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

/**
 * 数値1行分のセル。ヒット内訳がそのフィールドを定義していれば内訳表示（例: 50+45×3）、
 * 無ければ従来通り技単位の単一値。共鳴上書きも同じ優先順位（内訳→単一値）で判定する。
 */
const buildNumericRow = ({
  header,
  key,
}: (typeof HIT_BREAKDOWN_NUMERIC_ROWS)[number]): ComparisonRow => ({
  header,
  phaseDependentKeys: [key],
  renderCell: (move) => (
    <>
      {/* undefined 判定は resonanceNumericText と同じ理由で hitBreakdownDefines と別に必要。 */}
      {move.hitBreakdown !== undefined &&
      hitBreakdownDefines(move.hitBreakdown, key)
        ? formatHitBreakdownValue(move.hitBreakdown, key)
        : formatDamageValue(move[key])}
      <ResonanceOverride value={resonanceNumericText(move, key)} />
    </>
  ),
});

/** ダメージ系の行。全変種で未入力ならセクションごと表示しない（move-detail.tsx 側 hasAnyDamage 参照）。 */
export const DAMAGE_ROWS: ComparisonRow[] =
  HIT_BREAKDOWN_NUMERIC_ROWS.map(buildNumericRow);
