import type { ReactNode } from "react";
import { isPhaseInvariantCell } from "@/lib/moves/fieldPhaseDisplay";
import type { FieldPhaseOverride, Move } from "@/types/move";

/** 比較テーブルの 1 列。1 列 = 1 変種（通常 / ため / 派生 / ジャスト入力 など）。 */
export interface ComparisonColumn {
  /**
   * 表示上の一意キー（React key・DOM id 用）。実技の id とは限らない。
   * ジャスト入力列は元の技と同じ move.id を持つ合成 Move のため、専用キーで区別する。
   */
  key: string;
  move: Move;
  label: string;
  /** ジャスト入力版の列なら true。ジャスト入力固有の行（受付フレーム等）の出し分けに使う。 */
  isJustInput?: boolean;
  /**
   * ため/派生の列で、コマンド表示の基準になる親技のコマンド。親技自身の列では undefined。
   * 親のコマンドがフェイズで変わる技があるため、列のフェイズに合わせた値を持つ。
   */
  parentCommand?: string;
  /**
   * 直前の列と DP/FP の対をなす FP 列のとき、フェイズ差で値が変わる項目。
   * 共通技で FP 差分がある場合のみ設定され、対にならない列では undefined。
   */
  fieldPhaseDiffKeys?: (keyof FieldPhaseOverride)[];
}

/**
 * 比較テーブルの 1 行。行見出しと、各列（変種）のセルを描画する関数を持つ。
 * ほとんどの行は move だけで描画できるが、列の種別に応じて出し分けたい行のために
 * column も渡す（例: ジャスト受付フレームはジャスト入力列にだけ出す）。
 */
export interface ComparisonRow {
  header: string;
  renderCell: (move: Move, column: ComparisonColumn) => ReactNode;
  /**
   * この行の表示が依存する、フェイズ差で変わりうる項目。DP/FP 列を 1 セルに結合してよいかの
   * 判定に使い、依存しない項目しか変わっていなければ結合する。
   *
   * 何にも依存しない行（攻撃属性など、そもそもフェイズで変わらない項目）は空配列を指定する。
   * 未指定の行は結合しない。**renderCell が読む項目を変えたらここも必ず更新すること**
   * （食い違うと、実際には値が違うセルを結合して誤った表示になる）。
   * ヒット内訳 (hitBreakdown) は表示を横断的に変えるため個別に挙げる必要はなく、
   * fieldPhase が触っていたら結合自体を止める（mergesWithPreviousColumn 参照）。
   */
  phaseDependentKeys?: (keyof FieldPhaseOverride)[];
}

/**
 * FP 列を直前の DP 列と 1 セルに結合してよいか。
 * 判定材料が揃わない場合（どちらかの宣言が無い）は結合しない側に倒す。
 */
const mergesWithPreviousColumn = (
  column: ComparisonColumn,
  row: ComparisonRow,
): boolean => {
  const { fieldPhaseDiffKeys } = column;
  if (fieldPhaseDiffKeys === undefined || row.phaseDependentKeys === undefined) {
    return false;
  }
  return isPhaseInvariantCell(fieldPhaseDiffKeys, row.phaseDependentKeys);
};

/** 行見出し列のスクリーンリーダー向けラベル（視覚的には空セル）。 */
const ROW_HEADER_ACCESSIBLE_LABEL = "項目";

interface MoveComparisonTableProps {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  /** "number" はフレーム値向けに右寄せ（既定）、"text" はテキスト主体で左寄せ。 */
  align?: "number" | "text";
  /** 指定すると、resonanceOnly の列見出しの下にこのラベルをフラグ表示する。 */
  resonanceOnlyLabel?: string;
  /**
   * true なら変種列の見出しに id（技 ID）を付け、技一覧からのアンカーリンクの着地点にする。
   * id はページ内で一意にする必要があるため、複数テーブルを並べるページでは 1 つだけに指定する。
   */
  withColumnAnchors?: boolean;
}

/**
 * 変種（通常/ため/派生）を列に横並びして項目を比較表示する汎用テーブル。
 * ヘッダ構造とセルの map をここに集約し、フレーム表・属性表で共通利用する。
 */
export const MoveComparisonTable = ({
  columns,
  rows,
  align = "number",
  resonanceOnlyLabel,
  withColumnAnchors = false,
}: MoveComparisonTableProps) => (
  <div className="move-detail__table-scroll">
    <table
      className={
        align === "text" ? "frame-table frame-table--attrs" : "frame-table"
      }
    >
      <thead>
        <tr>
          <th>
            <span className="visually-hidden">
              {ROW_HEADER_ACCESSIBLE_LABEL}
            </span>
          </th>
          {columns.map((column) => (
            <th key={column.key} id={withColumnAnchors ? column.key : undefined}>
              {column.label}
              {resonanceOnlyLabel !== undefined &&
                column.move.resonanceOnly === true && (
                  <span className="move-detail__col-flag">
                    {resonanceOnlyLabel}
                  </span>
                )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.header}>
            <th>{row.header}</th>
            {columns.map((column, index) => {
              // 直前の DP 列が colSpan で覆っている FP 列は、セル自体を出さない。
              if (mergesWithPreviousColumn(column, row)) {
                return null;
              }
              const nextColumn = columns[index + 1];
              const spansNextColumn =
                nextColumn !== undefined &&
                mergesWithPreviousColumn(nextColumn, row);
              return (
                <td key={column.key} colSpan={spansNextColumn ? 2 : undefined}>
                  {row.renderCell(column.move, column)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
