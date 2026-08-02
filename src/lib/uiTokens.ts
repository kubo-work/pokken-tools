/**
 * 詳細ページ・編集画面のインラインスタイルで使う色とサイズのトークン。
 * 飽和アクセント色（resonance / variant / accent）はライト・ダーク両方で可読なため固定値。
 * 背景に依存する文字色（mute / description）は、ライト/ダーク切替に追従させるため
 * globals.css がテーマごとに定義する CSS 変数を参照する。
 */
export const UI_COLORS = {
  /** 共鳴差分（→ 値の並記、共鳴専用バッジ）。 */
  resonance: "#f59e0b",
  /** ため・派生バッジの紫。 */
  variant: "#c084fc",
  /** ジャスト入力バッジの緑。 */
  justInput: "#34d399",
  /** リンクや「説明」サマリーのアクセント青。 */
  accent: "#6ea8fe",
  /** 補助テキスト（備考など）のグレー。テーマ追従。 */
  mute: "var(--text-dim)",
  /** 展開した説明本文の文字色。テーマ追従。 */
  description: "var(--text)",
} as const;

export const UI_SIZES = {
  /** バッジ / 補助テキスト用の最小サイズ。 */
  caption: 11,
  /** サマリー / 凡例。 */
  small: 12,
  /** 展開された説明本文。 */
  body: 13,
  /** 技一覧で子技・ジャスト入力行を1段下げるときの字下げ幅 (px)。 */
  rowIndentStep: 16,
} as const;

/**
 * 説明の引用ブロック背景色（accent 色をうっすら）。
 * UI_COLORS.accent と整合させたい場合は変更時に追従する。
 */
export const DESCRIPTION_BLOCK_BG = "rgba(110, 168, 254, 0.08)";
