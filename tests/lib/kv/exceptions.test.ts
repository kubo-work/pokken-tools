import { describe, expect, test } from "bun:test";
import { getExceptions } from "@/lib/kv/exceptions";
import { KV_KEYS } from "@/lib/kv/keys";
import { publicKvCacheTtlStorage } from "@/lib/kv/cacheTtlStorage";
import { TEST_CACHE_TTL_SECONDS, runWithRecordingKv } from "../../helpers/kvEnv";

describe("getExceptions の KV 読み取りオプション", () => {
  test("cacheTtlSeconds を渡すと cacheTtl 付きで get する", async () => {
    const { gets } = await runWithRecordingKv(() =>
      getExceptions({ cacheTtlSeconds: TEST_CACHE_TTL_SECONDS }),
    );
    expect(gets).toHaveLength(1);
    expect(gets[0].key).toBe(KV_KEYS.exceptions);
    expect(gets[0].options.type).toBe("json");
    expect(gets[0].options.cacheTtl).toBe(TEST_CACHE_TTL_SECONDS);
  });

  test("cacheTtlSeconds を渡さないと cacheTtl を指定しない（KV 既定のまま）", async () => {
    const { gets } = await runWithRecordingKv(() => getExceptions());
    expect(gets[0].options.type).toBe("json");
    expect(gets[0].options.cacheTtl).toBeUndefined();
  });

  test("公開ページのスコープ内では引数無しでも cacheTtl が効く", async () => {
    const { gets } = await runWithRecordingKv(() =>
      publicKvCacheTtlStorage.run(TEST_CACHE_TTL_SECONDS, () =>
        getExceptions(),
      ),
    );
    expect(gets[0].options.cacheTtl).toBe(TEST_CACHE_TTL_SECONDS);
  });

  test("KV が未投入なら空配列を返す", async () => {
    const { result } = await runWithRecordingKv(() => getExceptions());
    expect(result).toEqual([]);
  });
});
