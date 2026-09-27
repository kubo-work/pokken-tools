import babelParser from "@babel/eslint-parser";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * React のルール（フックの規則 + React Compiler の規則）だけを検査する ESLint 設定。
 *
 * React Compiler はルール違反のコンポーネントを黙って最適化対象から外すため、その検出を目的とする。
 * 型検査とコード品質は tsc とレビュー規約が担うので、スタイル系のルールは入れない。
 *
 * パーサーは typescript-eslint ではなく Babel を使う。typescript-eslint は TypeScript 7 に
 * 未対応で、本リポジトリの tsc（7 系）と同居できない。Babel は React Compiler 用に導入済みの
 * @babel/preset-typescript で構文だけを読む。react-hooks のルールは型情報を使わないため十分。
 */
export default [
  {
    ignores: ["build/", ".react-router/", "**/*.d.ts"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ["@babel/preset-typescript"],
        },
      },
    },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
];
