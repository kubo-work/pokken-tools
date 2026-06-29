import type { ReactNode } from "react";
import type { Move } from "@/types/move";

/** 比較テーブルの 1 列。1 列 = 1 変種（通常 / ため / 派生 など）。 */
export interface ComparisonColumn {
  move: Move;
  label: string;
}

/** 比較テーブルの 1 行。行見出しと、各列（変種）のセルを描画する関数を持つ。 */
export interface ComparisonRow {
  header: string;
  renderCell: (move: Move) => ReactNode;
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
            <th key={column.move.id}>
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
              <td key={column.move.id}>{row.renderCell(column.move)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
