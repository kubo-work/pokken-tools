/**
 * 公開側テーマ（ライト/ダーク）の定数と型。
 * localStorage キーやテーマ値リテラルを一元化し、保存側と復元側でのズレ（タイプミスによる
 * サイレントな復元不具合）を防ぐ。admin 側は Mantine の色スキーム機構を使うため対象外。
 */
export const THEME_STORAGE_KEY = "theme";

export const THEME = {
  LIGHT: "light",
  DARK: "dark",
} as const;

export type Theme = (typeof THEME)[keyof typeof THEME];

/** テーマ切替ボタンの aria-label / title。公開側・admin 側で文言を揃える。 */
export const THEME_TOGGLE_LABEL = {
  TO_LIGHT: "ライトモードに切り替える",
  TO_DARK: "ダークモードに切り替える",
} as const;
