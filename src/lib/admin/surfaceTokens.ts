/**
 * admin（Mantine）の面の階層を表す CSS 変数の参照名を一元管理する。
 * 実色は globals.css の data-mantine-color-scheme 側で定義し、ここでは参照名だけを集約して
 * 各コンポーネントへの直書き（タイポでサイレントに効かなくなる事故）を防ぐ。
 */
export const SURFACE = {
  /** カード面（body より明るく＝浮く）。 */
  card: "var(--surface-1)",
  /** 入れ子・沈める面（暗く＝沈む）。 */
  sunken: "var(--surface-2)",
  /** カード／入力欄のボーダー。 */
  border: "var(--surface-border)",
} as const;

/** 親子関係・選択を示す amber のアクセント帯（左ボーダー用）。 */
export const ACCENT_BORDER = "3px solid var(--mantine-color-amber-5)";
