/**
 * 詳細ページ・編集画面のインラインスタイルで使う色とサイズのトークン。
 * CSS 変数化はせず、TypeScript 定数で集約する。
 */
export const UI_COLORS = {
  /** 共鳴差分（→ 値の並記、共鳴専用バッジ）。 */
  resonance: "#f59e0b",
  /** ため・派生バッジの紫。 */
  variant: "#c084fc",
  /** リンクや「説明」サマリーのアクセント青。 */
  accent: "#6ea8fe",
  /** 補助テキスト（備考など）のグレー。 */
  mute: "#9095a0",
  /** 展開した説明本文の文字色。 */
  description: "#cdd2db",
} as const;

export const UI_SIZES = {
  /** バッジ / 補助テキスト用の最小サイズ。 */
  caption: 11,
  /** サマリー / 凡例。 */
  small: 12,
  /** 展開された説明本文。 */
  body: 13,
} as const;

/**
 * 説明の引用ブロック背景色（accent 色をうっすら）。
 * UI_COLORS.accent と整合させたい場合は変更時に追従する。
 */
export const DESCRIPTION_BLOCK_BG = "rgba(110, 168, 254, 0.08)";
