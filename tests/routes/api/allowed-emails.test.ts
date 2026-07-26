import { describe, expect, test } from "bun:test";
import {
  TEST_API_USER,
  errorMessageOf,
  invokeAction,
  mockAuthenticatedApiUser,
} from "../../helpers/apiRoute";

mockAuthenticatedApiUser();
const { action } = await import("../../../app/routes/api/allowed-emails");

const makeRequest = (
  method: string,
  options: { body?: string; query?: string } = {},
): Request =>
  new Request(
    `http://localhost/api/admin/allowed-emails${options.query ?? ""}`,
    { method, body: options.body },
  );

/**
 * addAllowedEmail / removeAllowedEmail（D1 書き込み）に到達するのは検証成功時のみなので、
 * D1 をモックせずに検証できる 4xx 分岐だけを対象にする。
 */
describe("POST /api/admin/allowed-emails", () => {
  test("不正な JSON は 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("POST", { body: "not json" }),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Invalid JSON");
  });

  test("メールアドレス形式でない値は 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("POST", {
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Validation failed");
  });
});

describe("DELETE /api/admin/allowed-emails", () => {
  test("email クエリパラメータが無ければ 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("DELETE"),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("email is required");
  });

  test("email クエリパラメータが空文字でも 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("DELETE", { query: "?email=" }),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("email is required");
  });

  test("ログイン中の自分自身は削除できず 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("DELETE", {
        query: `?email=${encodeURIComponent(TEST_API_USER.email)}`,
      }),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Cannot remove your own email");
  });

  test("大文字小文字が違っても自分自身と判定して 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("DELETE", {
        query: `?email=${encodeURIComponent(TEST_API_USER.email.toUpperCase())}`,
      }),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Cannot remove your own email");
  });
});

describe("その他のメソッド", () => {
  test("POST / DELETE 以外は 405", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("PUT", { body: JSON.stringify({}) }),
    });
    expect(response.status).toBe(405);
    expect(await errorMessageOf(response)).toBe("Method Not Allowed");
  });
});
