import { createRequestHandler } from "react-router";
import { cloudflareEnvStorage } from "@/lib/envContext";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

/**
 * Cloudflare Workers のエントリポイント。
 *
 * env を AsyncLocalStorage に格納した内側でリクエスト処理を実行することで、
 * src/lib 配下の getEnv() が引数なしで env を取得できるようにする（envContext.ts 参照）。
 *
 * React Router v8 では RequestHandler の load context が RouterContextProvider 型になり、
 * 従来（v7）の平オブジェクト context は渡せない。本アプリの loader/action はすべて getEnv()
 * 経由で env を読むため、context は渡さず AsyncLocalStorage のみで env を供給する。
 */
export default {
  fetch(request, env) {
    return cloudflareEnvStorage.run(env, () => requestHandler(request));
  },
} satisfies ExportedHandler<CloudflareEnv>;
