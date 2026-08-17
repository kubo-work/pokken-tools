import { AsyncLocalStorage } from "node:async_hooks";
import type { KvReadOptions } from "./cacheTtl";

/**
 * リクエストスコープの KV cacheTtl を保持する AsyncLocalStorage。
 *
 * 公開ページのレイアウト middleware がリクエスト単位で秒数を載せ、src/lib/kv の読み取り関数が
 * 既定値として拾う。loader ごとに TTL を引数で引き回す方式は、公開ルートを追加したときに
 * 渡し忘れても何も検知されず、そのルートだけ静かにキャッシュが効かなくなる。envContext.ts の
 * cloudflareEnvStorage と同じ理由・同じ形で、リクエストスコープの値をここに寄せる。
 *
 * store が無いスコープ（管理画面・API・スクリプト）では undefined になり、KV 既定の挙動に戻る。
 * AsyncLocalStorage の利用には wrangler.toml の nodejs_compat フラグが必要（設定済み）。
 */
export const publicKvCacheTtlStorage = new AsyncLocalStorage<number>();

/**
 * KV の get に渡す JSON 読み取りオプションを組み立てる。
 * 明示指定を最優先し、無ければリクエストスコープの既定値を使う。
 */
export const toJsonGetOptions = (
  options: KvReadOptions,
): KVNamespaceGetOptions<"json"> => ({
  type: "json",
  cacheTtl: options.cacheTtlSeconds ?? publicKvCacheTtlStorage.getStore(),
});
