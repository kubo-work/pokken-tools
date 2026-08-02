import type { ReactNode } from "react";
import type { Move } from "@/types/move";

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
}

/**
 * 比較テーブルの 1 行。行見出しと、各列（変種）のセルを描画する関数を持つ。
 * ほとんどの行は move だけで描画できるが、列の種別に応じて出し分けたい行のために
 * column も渡す（例: ジャスト受付フレームはジャスト入力列にだけ出す）。
 */
export interface ComparisonRow {
  header: string;
  renderCell: (move: Move, column: ComparisonColumn) => ReactNode;
}

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
            {columns.map((column) => (
              <td key={column.key}>{row.renderCell(column.move, column)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
