import type { HitBreakdownEntry, Move } from "@/types/move";
import type { HitBreakdownCategoricalKey } from "./moveEnums";
import {
  AIR_GROUND_JUDGMENT_META,
  GUARD_LEVEL_LABEL_KEY_BY_STYLE,
  GUARD_LEVEL_META,
  type LabelStyle,
} from "./moveLabels";
import { hitBreakdownDefines } from "./moveRules";

/**
 * 判定系フィールド（判定・空地）の表示。値を文字列にするだけの moveFormat と違い、
 * 「ヒット内訳が対象フィールドを定義していれば内訳ごと、無ければ技単位の代表値」という
 * 解決を伴う。判定と空地は必須／任意の違いがあるが、この解決の形は共通なので
 * CategoricalFieldResolver で差分だけを差し替える。
 */

/** 各グループの開始ヒット位置（1始まり）を1回の走査で求める。 */
const hitBreakdownStartPositions = (entries: HitBreakdownEntry[]): number[] => {
  const starts: number[] = [];
  let nextStart = 1;
  for (const entry of entries) {
    starts.push(nextStart);
    nextStart += entry.hitCount;
  }
  return starts;
};

/** 開始位置とヒット数から「1ヒット目」「2〜4ヒット目」のようなヒット範囲ラベルを作る。 */
const hitRangeLabel = (start: number, hitCount: number): string => {
  const end = start + hitCount - 1;
  return start === end ? `${start}ヒット目` : `${start}〜${end}ヒット目`;
};

/** ヒット内訳1グループ分の判定系フィールドの表示ラベル。未設定なら undefined。 */
const hitBreakdownCategoricalEntryLabel = (
  entry: HitBreakdownEntry,
  key: HitBreakdownCategoricalKey,
  labelStyle: LabelStyle,
): string | undefined => {
  if (key === "guardLevel") {
    return entry.guardLevel === undefined
      ? undefined
      : GUARD_LEVEL_META[entry.guardLevel][
          GUARD_LEVEL_LABEL_KEY_BY_STYLE[labelStyle]
        ];
  }
  // 空・地は元々 label が短いため labelStyle に関わらず同じ表記を使う。
  return entry.airGroundJudgment === undefined
    ? undefined
    : AIR_GROUND_JUDGMENT_META[entry.airGroundJudgment].label;
};

/**
 * ヒット内訳の判定系フィールドを「1ヒット目: 上段」「2〜4ヒット目: 空」の行の配列にする。
 * 詳細ページ向けで、1グループ1行で表示する想定。未設定のグループは行ごと省略する。
 */
export const hitBreakdownCategoricalLines = (
  entries: HitBreakdownEntry[],
  key: HitBreakdownCategoricalKey,
): string[] => {
  const starts = hitBreakdownStartPositions(entries);
  return entries
    .map((entry, index) => {
      const label = hitBreakdownCategoricalEntryLabel(entry, key, "full");
      return label === undefined
        ? undefined
        : `${hitRangeLabel(starts[index], entry.hitCount)}: ${label}`;
    })
    .filter((text): text is string => text !== undefined);
};

/**
 * ヒット内訳の判定系フィールドの値だけを重複を除いて「上/空」のように連結する（一覧向け）。
 * 「何ヒット目か」はゲーム内訳を知らない閲覧者には伝わりにくいため一覧では出さず、
 * 詳細ページ（hitBreakdownCategoricalLines）に委譲する。どのグループにも値が無ければ undefined。
 */
const hitBreakdownCategoricalValueSummary = (
  entries: HitBreakdownEntry[],
  key: HitBreakdownCategoricalKey,
  labelStyle: LabelStyle,
): string | undefined => {
  const labels = entries
    .map((entry) => hitBreakdownCategoricalEntryLabel(entry, key, labelStyle))
    .filter((label): label is string => label !== undefined);
  const uniqueLabels = [...new Set(labels)];
  return uniqueLabels.length === 0 ? undefined : uniqueLabels.join("/");
};

/**
 * 判定系1フィールド分の「hitBreakdown が無いときに技単位の代表値をどう解決するか」の定義。
 * guardLevel（必須・null で概念なし）と airGroundJudgment（任意）で意味は異なるが、
 * どちらも「値が無ければ undefined」という同じ形に正規化して categoricalLinesFor /
 * categoricalSummaryFor から共通に扱えるようにする。
 */
interface CategoricalFieldResolver {
  hitBreakdownKey: HitBreakdownCategoricalKey;
  representativeLabel: (move: Move, labelStyle: LabelStyle) => string | undefined;
}

const GUARD_LEVEL_RESOLVER: CategoricalFieldResolver = {
  hitBreakdownKey: "guardLevel",
  representativeLabel: (move, labelStyle) =>
    move.guardLevel === null
      ? undefined
      : GUARD_LEVEL_META[move.guardLevel][
          GUARD_LEVEL_LABEL_KEY_BY_STYLE[labelStyle]
        ],
};

const AIR_GROUND_JUDGMENT_RESOLVER: CategoricalFieldResolver = {
  hitBreakdownKey: "airGroundJudgment",
  // 空・地は元々 label が短いため labelStyle に関わらず同じ表記を使う。
  representativeLabel: (move) =>
    move.airGroundJudgment === undefined
      ? undefined
      : AIR_GROUND_JUDGMENT_META[move.airGroundJudgment].label,
};

/**
 * 表示を内訳から引くべきか。内訳があっても対象フィールドを定義していなければ
 * 技単位の代表値にフォールバックする。詳細ページ向け・一覧向けの双方が同じ条件で分岐する。
 */
const usesHitBreakdownFor = (
  move: Move,
  resolver: CategoricalFieldResolver,
): move is Move & { hitBreakdown: HitBreakdownEntry[] } =>
  move.hitBreakdown !== undefined &&
  hitBreakdownDefines(move.hitBreakdown, resolver.hitBreakdownKey);

/**
 * 詳細ページ向け表示行。ヒット内訳が対象フィールドを含む場合はヒット範囲ごとの行、
 * 無ければ技単位の代表値1行。どちらも値が無ければ空配列。
 */
const categoricalLinesFor = (
  move: Move,
  resolver: CategoricalFieldResolver,
): string[] => {
  if (usesHitBreakdownFor(move, resolver)) {
    return hitBreakdownCategoricalLines(
      move.hitBreakdown,
      resolver.hitBreakdownKey,
    );
  }
  const label = resolver.representativeLabel(move, "full");
  return label === undefined ? [] : [label];
};

/**
 * 一覧向け表示。ヒット内訳がある技は値だけを「上/下」のように出し、ヒット位置は
 * 詳細ページ（categoricalLinesFor）に委譲する。単一値の技は従来通り短縮ラベル。
 */
const categoricalSummaryFor = (
  move: Move,
  resolver: CategoricalFieldResolver,
): string | undefined => {
  if (usesHitBreakdownFor(move, resolver)) {
    return hitBreakdownCategoricalValueSummary(
      move.hitBreakdown,
      resolver.hitBreakdownKey,
      "short",
    );
  }
  return resolver.representativeLabel(move, "short");
};

/** 「判定」の詳細ページ向け表示行。判定という概念自体が無い技（guardLevel === null）は空配列。 */
export const moveGuardLevelLines = (move: Move): string[] =>
  categoricalLinesFor(move, GUARD_LEVEL_RESOLVER);

/** 「判定」の一覧向け表示。 */
export const moveGuardLevelShortLabel = (move: Move): string | undefined =>
  categoricalSummaryFor(move, GUARD_LEVEL_RESOLVER);

/** 「空・地」の詳細ページ向け表示行。技単位の値も未設定なら空配列。 */
export const moveAirGroundJudgmentLines = (move: Move): string[] =>
  categoricalLinesFor(move, AIR_GROUND_JUDGMENT_RESOLVER);

/** 「空・地」の一覧向け表示。 */
export const moveAirGroundJudgmentLabel = (move: Move): string | undefined =>
  categoricalSummaryFor(move, AIR_GROUND_JUDGMENT_RESOLVER);
