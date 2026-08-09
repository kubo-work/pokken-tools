import { afterEach, describe, expect, test } from "bun:test";
import {
  DEFAULT_SAVE_MESSAGES,
  saveWithFeedback,
  sendJson,
  type FailureMessages,
  type SaveMessages,
} from "@/lib/admin/adminApiClient";
import { ADMIN_API_ENDPOINTS } from "@/lib/admin/endpoints";

const FAILURE_MESSAGES: FailureMessages = {
  withoutDetail: "追加に失敗しました",
  withDetail: "追加に失敗しました",
};

const SAVE_MESSAGES: SaveMessages = {
  ...DEFAULT_SAVE_MESSAGES,
  withoutDetail: "保存に失敗しました（入力内容を確認してください）",
};

interface RecordedCall {
  url: string;
  init: RequestInit | undefined;
}

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
});

/**
 * console.error を差し替えて記録する。
 * 通信例外の検証では adminApiClient が意図的にログを出すため、そのままだとテスト出力に
 * スタックトレースが混ざる。捨てずに記録して「ログが出ていること」も検証する。
 */
const captureConsoleError = (): unknown[][] => {
  const logs: unknown[][] = [];
  console.error = (...args: unknown[]): void => {
    logs.push(args);
  };
  return logs;
};

/** fetch を差し替え、渡された引数を記録しつつ指定の応答を返す。 */
const stubFetch = (
  respond: () => Response | Promise<Response>,
): RecordedCall[] => {
  const calls: RecordedCall[] = [];
  const stub = async (url: string, init?: RequestInit): Promise<Response> => {
    calls.push({ url, init });
    return respond();
  };
  globalThis.fetch = stub as unknown as typeof fetch;
  return calls;
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("sendJson", () => {
  test("メソッドと JSON ボディを指定どおりに送る", async () => {
    const calls = stubFetch(() => jsonResponse({ ok: true }));
    await sendJson(ADMIN_API_ENDPOINTS.exceptions, {
      method: "PUT",
      body: [{ id: "a" }],
      failureMessages: FAILURE_MESSAGES,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe(ADMIN_API_ENDPOINTS.exceptions);
    expect(calls[0]?.init?.method).toBe("PUT");
    expect(calls[0]?.init?.body).toBe(JSON.stringify([{ id: "a" }]));
  });

  test("body 省略時は Content-Type もボディも付けない", async () => {
    const calls = stubFetch(() => jsonResponse({ ok: true }));
    await sendJson(ADMIN_API_ENDPOINTS.allowedEmails, {
      method: "DELETE",
      failureMessages: FAILURE_MESSAGES,
    });
    expect(calls[0]?.init?.method).toBe("DELETE");
    expect(calls[0]?.init?.body).toBeUndefined();
    expect(calls[0]?.init?.headers).toBeUndefined();
  });

  test("成功時は応答本文を data として返す", async () => {
    stubFetch(() =>
      jsonResponse({ email: "user@example.com", createdAt: "2026-07-26" }),
    );
    const result = await sendJson<{ email: string; createdAt: string }>(
      ADMIN_API_ENDPOINTS.allowedEmails,
      { method: "POST", body: {}, failureMessages: FAILURE_MESSAGES },
    );
    expect(result).toEqual({
      ok: true,
      data: { email: "user@example.com", createdAt: "2026-07-26" },
    });
  });

  test("成功しても本文が JSON でなければ data は undefined", async () => {
    stubFetch(() => new Response("", { status: 200 }));
    const result = await sendJson(ADMIN_API_ENDPOINTS.exceptions, {
      method: "PUT",
      body: {},
      failureMessages: FAILURE_MESSAGES,
    });
    expect(result).toEqual({ ok: true, data: undefined });
  });

  test("失敗しエラー本文があれば接頭辞に続けて本文を出す", async () => {
    stubFetch(() => new Response("id が不正です", { status: 400 }));
    const result = await sendJson(ADMIN_API_ENDPOINTS.exceptions, {
      method: "PUT",
      body: {},
      failureMessages: FAILURE_MESSAGES,
    });
    expect(result).toEqual({
      ok: false,
      message: "追加に失敗しました: id が不正です",
    });
  });

  test("失敗しエラー本文が空なら本文なし用の文言を出す", async () => {
    stubFetch(() => new Response("", { status: 500 }));
    const result = await sendJson(ADMIN_API_ENDPOINTS.exceptions, {
      method: "PUT",
      body: {},
      failureMessages: FAILURE_MESSAGES,
    });
    expect(result).toEqual({
      ok: false,
      message: FAILURE_MESSAGES.withoutDetail,
    });
  });

  test("エラー本文が issues 付き JSON なら、画面には整形した一言だけ出し、生の JSON はコンソールにだけ出す", async () => {
    const errorLogs = captureConsoleError();
    const errorBody = {
      error: "Validation failed",
      issues: [{ path: ["totalDamage"], message: "多段ヒットの技にのみ設定できます" }],
    };
    stubFetch(() => jsonResponse(errorBody, 400));
    const result = await sendJson(ADMIN_API_ENDPOINTS.exceptions, {
      method: "PUT",
      body: {},
      failureMessages: FAILURE_MESSAGES,
    });
    expect(result).toEqual({
      ok: false,
      message: "追加に失敗しました: totalDamage: 多段ヒットの技にのみ設定できます",
    });
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0]?.[1]).toEqual(errorBody);
  });

  test("エラー本文が想定外の形の JSON でも throw せず、詳細なしの文言に落とす", async () => {
    const errorLogs = captureConsoleError();
    // issues が配列でない壊れた応答。整形しようとして実行時エラーになると、原因と無関係な
    // 「通信エラー」に化けてしまうため、安全側（詳細なし）に倒れることを保証する。
    stubFetch(() => jsonResponse({ error: 1, issues: "壊れた形" }, 400));
    const result = await sendJson(ADMIN_API_ENDPOINTS.exceptions, {
      method: "PUT",
      body: {},
      failureMessages: FAILURE_MESSAGES,
    });
    expect(result).toEqual({
      ok: false,
      message: FAILURE_MESSAGES.withoutDetail,
    });
    expect(errorLogs).toHaveLength(1);
  });

  test("エラー本文が issues の無い JSON なら error 文字列を画面に出す", async () => {
    stubFetch(() => jsonResponse({ error: "Unknown character id" }, 404));
    const result = await sendJson(ADMIN_API_ENDPOINTS.exceptions, {
      method: "PUT",
      body: {},
      failureMessages: FAILURE_MESSAGES,
    });
    expect(result).toEqual({
      ok: false,
      message: "追加に失敗しました: Unknown character id",
    });
  });

  test("通信例外を throw せず結果として返し、原因はログに残す", async () => {
    const errorLogs = captureConsoleError();
    stubFetch(() => {
      throw new Error("offline");
    });
    const result = await sendJson(ADMIN_API_ENDPOINTS.exceptions, {
      method: "PUT",
      body: {},
      failureMessages: FAILURE_MESSAGES,
    });
    expect(result).toEqual({ ok: false, message: "通信エラー: offline" });
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0]?.[0]).toBe(
      `PUT ${ADMIN_API_ENDPOINTS.exceptions} failed`,
    );
  });
});

describe("saveWithFeedback", () => {
  test("PUT で送り、成功時は ok: true と成功文言を返す", async () => {
    const calls = stubFetch(() => jsonResponse({ ok: true }));
    const feedback = await saveWithFeedback(
      ADMIN_API_ENDPOINTS.exceptions,
      { a: 1 },
      SAVE_MESSAGES,
    );
    expect(calls[0]?.init?.method).toBe("PUT");
    expect(calls[0]?.init?.body).toBe(JSON.stringify({ a: 1 }));
    expect(feedback).toEqual({ ok: true, message: SAVE_MESSAGES.success });
  });

  test("文言を省略すると既定文言を使う", async () => {
    stubFetch(() => jsonResponse({ ok: true }));
    const feedback = await saveWithFeedback(ADMIN_API_ENDPOINTS.exceptions, {});
    expect(feedback).toEqual({
      ok: true,
      message: DEFAULT_SAVE_MESSAGES.success,
    });
  });

  test("失敗時は呼び出し側の文言で Feedback を返す", async () => {
    stubFetch(() => new Response("", { status: 400 }));
    const feedback = await saveWithFeedback(
      ADMIN_API_ENDPOINTS.exceptions,
      {},
      SAVE_MESSAGES,
    );
    expect(feedback).toEqual({
      ok: false,
      message: SAVE_MESSAGES.withoutDetail,
    });
  });

  test("通信例外も Feedback に載せて返す", async () => {
    const errorLogs = captureConsoleError();
    stubFetch(() => {
      throw new Error("offline");
    });
    const feedback = await saveWithFeedback(ADMIN_API_ENDPOINTS.exceptions, {});
    expect(feedback).toEqual({ ok: false, message: "通信エラー: offline" });
    expect(errorLogs).toHaveLength(1);
  });
});
