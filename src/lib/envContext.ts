import { AsyncLocalStorage } from "node:async_hooks";

/**
 * リクエストごとの Cloudflare env バインディングを格納する AsyncLocalStorage。
 *
 * Next.js（OpenNext）では getCloudflareContext() が env を返していたが、React Router では
 * loader/action に渡される context.cloudflare.env が正となる。ただし src/lib 配下は
 * getEnv() 経由で env を読む規約になっており、引数で env を引き回すと全 lib のシグネチャが
 * 変わって影響が広範になる。そこで Worker エントリ（workers/app.ts）でリクエスト処理を
 * この storage.run() の内側で実行し、getEnv() は storage から取り出す方式にする。
 *
 * このモジュールは何もインポートしない（workers/app.ts と src/lib/cloudflare.ts の
 * 双方から参照されるため、循環参照を避ける目的で env 保持だけを担う独立モジュールにしている）。
 * AsyncLocalStorage の利用には wrangler.toml の nodejs_compat フラグが必要（設定済み）。
 */
export const cloudflareEnvStorage = new AsyncLocalStorage<CloudflareEnv>();
