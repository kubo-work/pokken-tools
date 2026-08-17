import { cloudflareEnvStorage } from "@/lib/envContext";

/**
 * KV 読み取りのテスト共通ヘルパー。
 *
 * src/lib/kv 配下は getEnv() 経由で env を読む規約のため、テストからは
 * cloudflareEnvStorage に偽 env を流し込んで KV の呼び出しを観測する。
 * 値そのものではなく「どんなオプションで get を呼んだか」を検証したいので、
 * 保存値は常に null（registry フォールバック経路）を返す。
 */

/**
 * 検証用の cacheTtl 秒数。
 * 「渡した値がそのまま KV へ届くか」だけを見たいので、本番の既定値（600）とは別の値にして
 * 既定値を変えてもテストが道連れにならないようにする。
 */
export const TEST_CACHE_TTL_SECONDS = 123;

export interface RecordedKvGet {
  key: string;
  options: KVNamespaceGetOptions<"json">;
}

/**
 * get の呼び出しを記録する偽 KV を env に載せて run を実行し、記録した呼び出しを返す。
 */
export const runWithRecordingKv = async <Result>(
  run: () => Promise<Result>,
): Promise<{ result: Result; gets: RecordedKvGet[] }> => {
  const gets: RecordedKvGet[] = [];
  // テストダブルのため FRAME_DATA_KV.get だけを実装する。CloudflareEnv の他のバインディングは
  // KV 読み取り関数が触らないので、構造的に満たさないまま env として渡す。
  const env = {
    FRAME_DATA_KV: {
      get: async (key: string, options: KVNamespaceGetOptions<"json">) => {
        gets.push({ key, options });
        return null;
      },
    },
  } as unknown as CloudflareEnv;
  const result = await cloudflareEnvStorage.run(env, run);
  return { result, gets };
};
