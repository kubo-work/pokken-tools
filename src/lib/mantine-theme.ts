/**
 * 管理画面用の共有 Mantine テーマ。
 *
 * これまで admin は MantineProvider にテーマを渡しておらず、Mantine デフォルト任せだった。
 * その結果「ページ body 背景 = Card のデフォルト背景」が同一色になり、技カードが背景に同化して
 * 視認性が著しく低かった。このテーマで以下を一元化する。
 *  - accent を公開側 (--accent: #f59e0b) と揃えた amber に統一（タブ・主要ボタン・フォーカス）
 *  - Card / Paper / 入力欄の既定を底上げし、面の階層と入力可能箇所を明示
 *  - サーフェスやボーダーの実色は globals.css のスキーム対応トークン側で定義する
 *
 * components は Component.extend を使わずプレーンオブジェクトで定義する。
 * .extend は型補完用の恒等ヘルパーで、このバージョンの RSC ビルドでは静的メソッドが解決されず
 * 実行時に "is not a function" となるため、ランタイムで等価なオブジェクト形を採用する。
 */
import { createTheme } from "@mantine/core";

/**
 * Tailwind amber を Mantine の 10 段スケールに対応させたもの。
 * index 5 (#f59e0b) を primaryShade に指定し、公開側アクセントと同色を主役にする。
 */
const amber: [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
] = [
  "#fffbeb",
  "#fef3c7",
  "#fde68a",
  "#fcd34d",
  "#fbbf24",
  "#f59e0b",
  "#d97706",
  "#b45309",
  "#92400e",
  "#78350f",
];

export const adminTheme = createTheme({
  primaryColor: "amber",
  primaryShade: { light: 5, dark: 5 },
  colors: { amber },
  // amber 上の文字色を背景に応じて自動で読みやすくする
  autoContrast: true,
  defaultRadius: "md",
  components: {
    Card: { defaultProps: { withBorder: true, radius: "md" } },
    Paper: { defaultProps: { withBorder: true, radius: "md" } },
    /*
     * 説明文 (description) はラベルと入力欄の間ではなく入力欄の下に出す。
     * 既定の label→description→input だと、説明文の行数差が同じグリッド行の
     * 入力欄の縦位置ズレになりフォームがガタつくため。InputWrapper への指定で
     * TextInput / NumberInput / Select / Textarea すべてに一括適用される。
     */
    InputWrapper: {
      defaultProps: {
        inputWrapperOrder: ["label", "input", "description", "error"],
      },
    },
    // 入力欄を filled にして、カード面 (surface-1) から一段浮かせ「入力できる場所」を明示
    TextInput: { defaultProps: { variant: "filled" } },
    NumberInput: { defaultProps: { variant: "filled" } },
    Select: { defaultProps: { variant: "filled" } },
    Textarea: { defaultProps: { variant: "filled" } },
  },
});
