import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
// Babel はスコープ付きの文字列名を `@locator/babel-plugin-babel-jsx` へ展開してしまうため、
// 名前指定ではなくプラグイン本体を直接読み込んで渡す。
import locatorBabelJsx from "@locator/babel-jsx";

/**
 * React Router の vite plugin は Babel パイプラインを外部へ公開しないため、
 * Next 時代に next.config.ts で有効化していた React Compiler と locator.js を
 * vite-plugin-babel（enforce: "pre"）として自前で差し込む。
 * - babel-plugin-react-compiler: 旧 `reactCompiler: true` 相当。dev / build 両方で有効。
 * - @locator/babel-jsx: 旧 `@locator/webpack-loader` の実体。JSX へ data-locatorjs-id を
 *   付与して Option+クリックでエディタを開けるようにする。React 19 で fiber の
 *   _debugSource が廃止されたため、この属性付与なしでは @locator/runtime は動作しない。
 */
export default defineConfig(({ command }) => {
  const isDevServer = command === "serve";

  return {
    plugins: [
      babel({
        include: /\.[jt]sx?$/,
        exclude: /node_modules/,
        babelConfig: {
          babelrc: false,
          configFile: false,
          // .tsx は preset 側がファイル名から JSX 構文を自動で有効化する。
          presets: ["@babel/preset-typescript"],
          plugins: [
            ["babel-plugin-react-compiler", { target: "19" }],
            ...(isDevServer
              ? [[locatorBabelJsx, { env: "development" }]]
              : []),
          ],
        },
      }),
      cloudflare({ viteEnvironment: { name: "ssr" } }),
      reactRouter(),
    ],
    /**
     * dev サーバで「後から発見される依存」を事前に宣言し、依存の再最適化を起こさせない。
     *
     * 再最適化が走ると browserHash が変わり、それ以前に取得済みのモジュール（?v=旧ハッシュ）と
     * 以降に取得するモジュール（?v=新ハッシュ）が同居する。React と React DOM が別コピーになると
     * "Invalid hook call" で画面が落ちる（リロードすると直る、という症状で現れる）。
     *
     * とくに react/compiler-runtime は React Compiler が Babel 変換時に注入するため、
     * 変換前のソースを走査する Vite の事前スキャンからは原理的に見つけられない。必ず後から
     * 発見されるので、ここでの明示が必須。
     * 残りは admin 配下でしか使われず遅延読み込みになる依存で、二度目の再最適化を防ぐための保険。
     */
    optimizeDeps: {
      include: [
        "react/compiler-runtime",
        "@dnd-kit/core",
        "@dnd-kit/sortable",
        "@dnd-kit/utilities",
        "@mantine/core",
        "@mantine/hooks",
        "@tabler/icons-react",
        ...(isDevServer ? ["@locator/runtime"] : []),
      ],
    },
    // tsconfig の paths（@/* → src/*）を Vite 側でも解決する（Vite 8 のビルトイン機能）。
    resolve: {
      tsconfigPaths: true,
    },
    // 開発サーバのポート。OAuth のリダイレクト URI（AUTH_URL / Google Console 登録値）が
    // http://localhost:2015 前提のため、Next 時代の `next dev -p 2015` と同じポートを維持する。
    server: {
      port: 2015,
    },
  };
});
