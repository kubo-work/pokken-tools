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
