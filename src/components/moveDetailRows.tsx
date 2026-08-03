import type { ReactNode } from "react";
import { FrameAdvantageText } from "@/components/FrameAdvantageText";
import { FrameNumber } from "@/components/FrameNumber";
import type { ComparisonRow } from "@/components/MoveComparisonTable";
import {
  ATTACK_TYPE_META,
  GUARD_LEVEL_META,
  HIT_BREAKDOWN_DAMAGE_KEYS,
  type HitBreakdownDamageKey,
  MOVE_VARIANT_META,
  childVariantLabel,
  formatDamageValue,
  formatHitBreakdownDamage,
  formatJustInputAcceptFrames,
  hitBreakdownCategoricalLines,
  hitBreakdownDefines,
  moveAirGroundJudgmentLines,
  moveGuardLevelLines,
  resonanceFlinchLabel,
  specialAttributeLabel,
} from "@/lib/meta";
import { formatMoveCommand } from "@/lib/moves/command";
import type { Move } from "@/types/move";

/**
 * 技詳細ページ (page.tsx) の比較テーブル行定義。
 * ページ本体はデータ取得と画面構成に専念させ、行の描画ロジックはここに集約する。
 */

/** テキストの複数値を区切って併記する際のセパレータ。「貫通 / アーマー」のような表記に使う。 */
const INLINE_LIST_SEPARATOR = " / ";

const attackTypeLabel = (move: Move): string =>
  move.attackType === undefined ? "-" : ATTACK_TYPE_META[move.attackType].label;

const specialAttributesLabel = (move: Move): string =>
  move.specialAttributes === undefined || move.specialAttributes.length === 0
    ? "-"
    : move.specialAttributes
        .map((attribute) => specialAttributeLabel(attribute, move))
        .join(INLINE_LIST_SEPARATOR);

/** 共鳴中の上書き値を amber の「→値」でセル内に併記する。 */
const ResonanceArrow = ({ children }: { children: ReactNode }) => (
  <span className="move-detail__override"> →{children}</span>
);

/**
 * 判定系（判定・空地）の表示行をセル内に描画する。ヒット内訳で複数行になる場合は
 * グループごとに行を分ける。1行だけならインラインのまま（共鳴の→を同じ行に併記するため）。
 */
const CategoricalLines = ({ lines }: { lines: string[] }) => {
  if (lines.length === 0) {
    return <>-</>;
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

/** ポケモン技キャンセル時の硬直差フィールド名。ガード/ヒット共通の行構造で扱う。 */
type CancelFrameAdvantageKey =
  | "guardFrameAdvantageOnPokemonMoveCancel"
  | "hitFrameAdvantageOnPokemonMoveCancel";

/**
 * ポケモン技キャンセル時の硬直差1行分のセル。ガード/ヒットで renderCell が同型のため
 * buildDamageValueRow と同様に定義から生成する。技単位の値が未計測なら "-"、
 * 共鳴上書きがあれば「→」で併記する。
 */
const buildCancelFrameAdvantageRow = (
  header: string,
  key: CancelFrameAdvantageKey,
): ComparisonRow => ({
  header,
  renderCell: (move) => (
    <>
      {move[key] === undefined ? "-" : <FrameNumber value={move[key]} />}
      {move.resonance?.[key] !== undefined && (
        <ResonanceArrow>
          <FrameNumber value={move.resonance[key]} />
        </ResonanceArrow>
      )}
    </>
  ),
});

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
  buildCancelFrameAdvantageRow(
    "ポケモン技キャンセル時のガード硬直差",
    "guardFrameAdvantageOnPokemonMoveCancel",
  ),
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
  buildCancelFrameAdvantageRow(
    "ポケモン技キャンセル時のヒット硬直差",
    "hitFrameAdvantageOnPokemonMoveCancel",
  ),
  {
    header: "ガード割り込み",
    // 1つ前の段との隙間なので親技（連携の起点）は値を持たず、常に "-" になる。
    renderCell: (move) => move.guardInterruptFrames ?? "-",
  },
  {
    header: "ジャスト受付",
    // 受付フレームはジャスト入力列固有の情報。通常列は非ジャスト時の値を並べているため、
    // そこに受付フレームを混ぜると別条件の値が同居して読みにくくなるので出さない。
    renderCell: (move, column) =>
      (column.isJustInput === true
        ? formatJustInputAcceptFrames(move.justInput?.acceptFrames)
        : undefined) ?? "-",
  },
];

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
 * page.tsx の hasAnyDamage 判定で使う（内訳のみの技でダメージセクションが消えるのを防ぐ）。
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
  renderCell: (move) => {
    const primaryText =
      move.hitBreakdown !== undefined && hitBreakdownDefines(move.hitBreakdown, key)
        ? formatHitBreakdownDamage(move.hitBreakdown, key)
        : formatDamageValue(move[key]);
    const resonanceText = resonanceDamageText(move, key);
    return (
      <>
        {primaryText}
        {resonanceText !== undefined && (
          <ResonanceArrow>{resonanceText}</ResonanceArrow>
        )}
      </>
    );
  },
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
    renderCell: (move) => {
      const resonanceText = resonanceGuardLevelText(move);
      return (
        <>
          <CategoricalLines lines={moveGuardLevelLines(move)} />
          {resonanceText !== undefined && (
            <ResonanceArrow>{resonanceText}</ResonanceArrow>
          )}
        </>
      );
    },
  },
  {
    header: "空・地",
    renderCell: (move) => {
      const resonanceText = resonanceAirGroundJudgmentText(move);
      return (
        <>
          <CategoricalLines lines={moveAirGroundJudgmentLines(move)} />
          {resonanceText !== undefined && (
            <ResonanceArrow>{resonanceText}</ResonanceArrow>
          )}
        </>
      );
    },
  },
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
