import { cloudflareEnvStorage } from "@/lib/envContext";

/**
 * Cloudflare バインディングを取得する薄いラッパ。
 * Worker エントリ（workers/app.ts）がリクエストごとに env を AsyncLocalStorage へ格納し、
 * ここではそこから取り出す。react-router dev では Miniflare 経由でローカル KV/D1 と
 * .dev.vars の値が返り、本番では実バインディングが返る。SSR 側からは必ずこれを通す。
 */
export async function getEnv(): Promise<CloudflareEnv> {
  const env = cloudflareEnvStorage.getStore();
  if (env === undefined) {
    throw new Error(
      "Cloudflare env is not available in this context（Worker のリクエストスコープ外から呼ばれた可能性）",
    );
  }
  return env;
}
