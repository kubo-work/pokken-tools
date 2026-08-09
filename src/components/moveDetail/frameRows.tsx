import { FrameAdvantageText } from "@/components/FrameAdvantageText";
import { FrameNumber } from "@/components/FrameNumber";
import type { ComparisonRow } from "@/components/MoveComparisonTable";
import {
  formatActiveUntilFrame,
  formatJustInputAcceptFrames,
} from "@/lib/moves/moveFormat";
import { NO_VALUE_LABEL } from "@/lib/moves/moveLabels";
import { ResonanceFrameOverride, ResonanceOverride } from "./rowHelpers";

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
  phaseDependentKeys: [key],
  renderCell: (move) => (
    <>
      {move[key] === undefined ? (
        NO_VALUE_LABEL
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
    phaseDependentKeys: ["startup"],
    renderCell: (move) => (
      <>
        {move.startup}
        <ResonanceOverride value={move.resonance?.startup} />
      </>
    ),
  },
  {
    header: "攻撃持続",
    phaseDependentKeys: ["activeUntilFrame"],
    renderCell: (move) => (
      <>
        {formatActiveUntilFrame(move.activeUntilFrame) ?? NO_VALUE_LABEL}
        <ResonanceOverride
          value={formatActiveUntilFrame(move.resonance?.activeUntilFrame)}
        />
      </>
    ),
  },
  {
    header: "ガード硬直差",
    phaseDependentKeys: ["guardFrameAdvantage"],
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
    phaseDependentKeys: ["hitFrameAdvantage"],
    renderCell: (move) => (
      <>
        {move.hitFrameAdvantage === undefined ? (
          NO_VALUE_LABEL
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
    // guardInterruptFrames はフェイズ差で変わらない（FieldPhaseOverride に無い）。
    phaseDependentKeys: [],
    // 1つ前の段との隙間なので親技（連携の起点）は値を持たず、常に "-" になる。
    renderCell: (move) => move.guardInterruptFrames ?? NO_VALUE_LABEL,
  },
  {
    header: "ジャスト受付",
    // 受付フレームは justInput 側の情報でフェイズ差では変わらない。
    phaseDependentKeys: [],
    // 受付フレームはジャスト入力列固有の情報。通常列は非ジャスト時の値を並べているため、
    // そこに受付フレームを混ぜると別条件の値が同居して読みにくくなるので出さない。
    renderCell: (move, column) =>
      (column.isJustInput === true
        ? formatJustInputAcceptFrames(move.justInput?.acceptFrames)
        : undefined) ?? NO_VALUE_LABEL,
  },
];
