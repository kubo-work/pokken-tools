import { describe, expect, test } from "bun:test";
import { CHARACTER_REGISTRY } from "@/lib/characters/registry";
import { getAllCharacters, getCharacter } from "@/lib/kv/getCharacters";
import { KV_KEYS } from "@/lib/kv/keys";
import { publicKvCacheTtlStorage } from "@/lib/kv/cacheTtlStorage";
import { TEST_CACHE_TTL_SECONDS, runWithRecordingKv } from "../../helpers/kvEnv";

const TEST_CHARACTER_ID = CHARACTER_REGISTRY[0].id;

describe("getCharacter の KV 読み取りオプション", () => {
  test("cacheTtlSeconds を渡すと cacheTtl 付きで get する", async () => {
    const { gets } = await runWithRecordingKv(() =>
      getCharacter(TEST_CHARACTER_ID, {
        cacheTtlSeconds: TEST_CACHE_TTL_SECONDS,
      }),
    );
    expect(gets).toHaveLength(1);
    expect(gets[0].key).toBe(KV_KEYS.character(TEST_CHARACTER_ID));
    expect(gets[0].options.type).toBe("json");
    expect(gets[0].options.cacheTtl).toBe(TEST_CACHE_TTL_SECONDS);
  });

  test("cacheTtlSeconds を渡さないと cacheTtl を指定しない（KV 既定のまま）", async () => {
    const { gets } = await runWithRecordingKv(() =>
      getCharacter(TEST_CHARACTER_ID),
    );
    expect(gets[0].options.type).toBe("json");
    expect(gets[0].options.cacheTtl).toBeUndefined();
  });

  test("registry に無い ID では KV を読まない", async () => {
    const { result, gets } = await runWithRecordingKv(() =>
      getCharacter("not_a_character", {
        cacheTtlSeconds: TEST_CACHE_TTL_SECONDS,
      }),
    );
    expect(result).toBeUndefined();
    expect(gets).toHaveLength(0);
  });
});

describe("getAllCharacters の KV 読み取りオプション", () => {
  test("registry の全キャラを cacheTtl 付きで get する", async () => {
    const { gets } = await runWithRecordingKv(() =>
      getAllCharacters({ cacheTtlSeconds: TEST_CACHE_TTL_SECONDS }),
    );
    expect(gets).toHaveLength(CHARACTER_REGISTRY.length);
    expect(
      gets.every((get) => get.options.cacheTtl === TEST_CACHE_TTL_SECONDS),
    ).toBe(true);
  });

  test("cacheTtlSeconds を渡さないと全キャラとも cacheTtl を指定しない", async () => {
    const { gets } = await runWithRecordingKv(() => getAllCharacters());
    expect(gets.every((get) => get.options.cacheTtl === undefined)).toBe(true);
  });

  test("公開ページのスコープ内では引数無しでも cacheTtl が効く", async () => {
    const { gets } = await runWithRecordingKv(() =>
      publicKvCacheTtlStorage.run(TEST_CACHE_TTL_SECONDS, () =>
        getAllCharacters(),
      ),
    );
    expect(
      gets.every((get) => get.options.cacheTtl === TEST_CACHE_TTL_SECONDS),
    ).toBe(true);
  });
});
