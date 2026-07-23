import { describe, expect, test } from "bun:test";
import { errorMessageOf } from "@/app/api/admin/testHelpers";
import { DELETE, POST } from "./route";

/**
 * addAllowedEmail（D1 書き込み）に到達するのはバリデーション成功時のみなので、
 * POST は D1 をモックせずに検証できる 4xx 分岐だけを対象にする。
 * DELETE の「自分自身を削除できない」分岐は auth() セッション解決が必要なため対象外。
 */
describe("POST /api/admin/allowed-emails", () => {
  test("不正な JSON は 400", async () => {
    const request = new Request("http://localhost/api/admin/allowed-emails", {
      method: "POST",
      body: "not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Invalid JSON");
  });

  test("メールアドレス形式でない値は 400", async () => {
    const request = new Request("http://localhost/api/admin/allowed-emails", {
      method: "POST",
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Validation failed");
  });
});

describe("DELETE /api/admin/allowed-emails", () => {
  test("email クエリパラメータが無ければ 400", async () => {
    const request = new Request("http://localhost/api/admin/allowed-emails", {
      method: "DELETE",
    });
    const response = await DELETE(request);
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("email is required");
  });

  test("email クエリパラメータが空文字でも 400", async () => {
    const request = new Request(
      "http://localhost/api/admin/allowed-emails?email=",
      { method: "DELETE" },
    );
    const response = await DELETE(request);
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("email is required");
  });
});
