import { describe, expect, test } from "bun:test";
import { SESSION_COOKIE_NAME } from "@/auth/authConstants";
import {
  PUBLIC_KV_CACHE_TTL_MINUTES,
  PUBLIC_KV_CACHE_TTL_SECONDS,
  resolveKvCacheTtlSeconds,
} from "@/lib/kv/cacheTtl";
import {
  publicKvCacheTtlStorage,
  toJsonGetOptions,
} from "@/lib/kv/cacheTtlStorage";
import { withPublicKvCacheTtl } from "@/lib/kv/publicCacheTtl.server";
import { TEST_CACHE_TTL_SECONDS } from "../../helpers/kvEnv";

/** Cloudflare KV が受け付ける cacheTtl の下限。 */
const KV_MINIMUM_CACHE_TTL_SECONDS = 30;

const requestWithCookie = (cookie: string | undefined): Request =>
  new Request(
    "https://example.com/punish",
    cookie === undefined ? undefined : { headers: { Cookie: cookie } },
  );

/** middleware を実行し、配下（next）から見えた cacheTtl のスコープ値を返す。 */
const cacheTtlSeenByNext = async (
  request: Request,
): Promise<number | undefined> => {
  let seen: number | undefined;
  await withPublicKvCacheTtl({ request }, async () => {
    seen = publicKvCacheTtlStorage.getStore();
    return new Response(null);
  });
  return seen;
};

describe("resolveKvCacheTtlSeconds", () => {
  test("未ログインの訪問者には公開ページ用の cacheTtl を返す", () => {
    expect(resolveKvCacheTtlSeconds(null)).toBe(PUBLIC_KV_CACHE_TTL_SECONDS);
  });

  test("ログイン中の管理者には cacheTtl を返さない（保存直後の内容を確認できるようにする）", () => {
    expect(
      resolveKvCacheTtlSeconds({ email: "admin@example.com" }),
    ).toBeUndefined();
  });

  test("公開ページ用の cacheTtl は KV が受け付ける下限以上", () => {
    expect(PUBLIC_KV_CACHE_TTL_SECONDS).toBeGreaterThanOrEqual(
      KV_MINIMUM_CACHE_TTL_SECONDS,
    );
  });

  test("管理画面の注記に使う分数は 600 秒 = 10 分", () => {
    // 秒数を変えたらこのテストが落ちる。admin の表示文言が変わったことに気づくための固定値。
    expect(PUBLIC_KV_CACHE_TTL_SECONDS).toBe(600);
    expect(PUBLIC_KV_CACHE_TTL_MINUTES).toBe(10);
  });
});

describe("toJsonGetOptions", () => {
  test("明示指定した cacheTtlSeconds を使う", () => {
    expect(
      toJsonGetOptions({ cacheTtlSeconds: TEST_CACHE_TTL_SECONDS }),
    ).toEqual({ type: "json", cacheTtl: TEST_CACHE_TTL_SECONDS });
  });

  test("スコープが無ければ cacheTtl を指定しない（管理画面・API・スクリプト）", () => {
    expect(toJsonGetOptions({}).cacheTtl).toBeUndefined();
  });

  test("スコープがあれば既定値として拾う", () => {
    const options = publicKvCacheTtlStorage.run(TEST_CACHE_TTL_SECONDS, () =>
      toJsonGetOptions({}),
    );
    expect(options.cacheTtl).toBe(TEST_CACHE_TTL_SECONDS);
  });

  test("明示指定はスコープより優先される", () => {
    const options = publicKvCacheTtlStorage.run(TEST_CACHE_TTL_SECONDS, () =>
      toJsonGetOptions({ cacheTtlSeconds: KV_MINIMUM_CACHE_TTL_SECONDS }),
    );
    expect(options.cacheTtl).toBe(KV_MINIMUM_CACHE_TTL_SECONDS);
  });
});

describe("withPublicKvCacheTtl", () => {
  test("Cookie が無いリクエストは公開ページ用の cacheTtl をスコープに載せる", async () => {
    expect(await cacheTtlSeenByNext(requestWithCookie(undefined))).toBe(
      PUBLIC_KV_CACHE_TTL_SECONDS,
    );
  });

  test("セッション Cookie を含まない Cookie ヘッダでもセッションを読まない", async () => {
    expect(await cacheTtlSeenByNext(requestWithCookie("theme=dark"))).toBe(
      PUBLIC_KV_CACHE_TTL_SECONDS,
    );
  });

  test("セッション Cookie 名を値の一部に含むだけの Cookie では判定しない", async () => {
    // `other=__pokken_session` のような値に引きずられてセッション読み取りへ進まないこと。
    expect(
      await cacheTtlSeenByNext(
        requestWithCookie(`other=${SESSION_COOKIE_NAME}`),
      ),
    ).toBe(PUBLIC_KV_CACHE_TTL_SECONDS);
  });

  test("next の応答をそのまま返す", async () => {
    const response = await withPublicKvCacheTtl(
      { request: requestWithCookie(undefined) },
      async () => new Response("ok", { status: 201 }),
    );
    expect(response.status).toBe(201);
  });
});
