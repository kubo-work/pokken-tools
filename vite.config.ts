import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
  ],
  // tsconfig の paths（@/* → src/*）を Vite 側でも解決する（Vite 8 のビルトイン機能）。
  resolve: {
    tsconfigPaths: true,
  },
  // 開発サーバのポート。OAuth のリダイレクト URI（AUTH_URL / Google Console 登録値）が
  // http://localhost:2015 前提のため、Next 時代の `next dev -p 2015` と同じポートを維持する。
  server: {
    port: 2015,
  },
});
