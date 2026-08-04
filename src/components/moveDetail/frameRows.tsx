import { FrameAdvantageText } from "@/components/FrameAdvantageText";
import { FrameNumber } from "@/components/FrameNumber";
import type { ComparisonRow } from "@/components/MoveComparisonTable";
import { formatJustInputAcceptFrames } from "@/lib/meta";
import {
  NOT_MEASURED_TEXT,
  ResonanceFrameOverride,
  ResonanceOverride,
} from "./rowHelpers";

/**
 * 技詳細ページ「フレームデータ」表の行定義。
 * 発生・硬直差・ガード割り込み・ジャスト受付など、時間に関する項目を扱う。
 */

/** ポケモン技キャンセル時の硬直差フィールド名。ガード/ヒット共通の行構造で扱う。 */
type CancelFrameAdvantageKey =
  | "guardFrameAdvantageOnPokemonMoveCancel"
  | "hitFrameAdvantageOnPokemonMoveCancel";

/**
 * ポケモン技キャンセル時の硬直差1行分のセル。ガード/ヒットで renderCell が同型のため
 * 定義から生成する。技単位の値が未計測なら "-"、共鳴上書きがあれば「→」で併記する。
 */
const buildCancelFrameAdvantageRow = (
  header: string,
  key: CancelFrameAdvantageKey,
): ComparisonRow => ({
  header,
  renderCell: (move) => (
    <>
      {move[key] === undefined ? (
        NOT_MEASURED_TEXT
      ) : (
        <FrameNumber value={move[key]} />
      )}
      <ResonanceFrameOverride value={move.resonance?.[key]} />
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
        <ResonanceOverride value={move.resonance?.startup} />
      </>
    ),
  },
  {
    header: "ガード硬直差",
    renderCell: (move) => (
      <>
        <FrameAdvantageText value={move.guardFrameAdvantage} />
        <ResonanceFrameOverride value={move.resonance?.guardFrameAdvantage} />
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
          NOT_MEASURED_TEXT
        ) : (
          <FrameAdvantageText value={move.hitFrameAdvantage} />
        )}
        <ResonanceFrameOverride value={move.resonance?.hitFrameAdvantage} />
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
    renderCell: (move) => move.guardInterruptFrames ?? NOT_MEASURED_TEXT,
  },
  {
    header: "ジャスト受付",
    // 受付フレームはジャスト入力列固有の情報。通常列は非ジャスト時の値を並べているため、
    // そこに受付フレームを混ぜると別条件の値が同居して読みにくくなるので出さない。
    renderCell: (move, column) =>
      (column.isJustInput === true
        ? formatJustInputAcceptFrames(move.justInput?.acceptFrames)
        : undefined) ?? NOT_MEASURED_TEXT,
  },
];
