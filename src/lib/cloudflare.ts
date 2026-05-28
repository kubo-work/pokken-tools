import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Cloudflare バインディングを取得する薄いラッパ。
 * next dev では Miniflare 経由でローカル KV/D1 が返り、本番では実バインディングが返る。
 * SSR 側からは必ずこれを通して env にアクセスする。
 */
export async function getEnv(): Promise<CloudflareEnv> {
  const { env } = await getCloudflareContext({ async: true });
  return env;
}
