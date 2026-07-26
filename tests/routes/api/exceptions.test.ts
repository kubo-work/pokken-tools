import { describe, expect, test } from "bun:test";
import {
  errorMessageOf,
  invokeAction,
  mockAuthenticatedApiUser,
} from "../../helpers/apiRoute";

mockAuthenticatedApiUser();
const { action } = await import("../../../app/routes/api/exceptions");

const makeRequest = (method: string, body?: string): Request =>
  new Request("http://localhost/api/admin/exceptions", { method, body });

/** setExceptions（KV 書き込み）に到達するのは検証成功時のみなので、4xx 分岐だけを対象にする。 */
describe("PUT /api/admin/exceptions", () => {
  test("PUT 以外のメソッドは 405", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("POST", JSON.stringify([])),
    });
    expect(response.status).toBe(405);
    expect(await errorMessageOf(response)).toBe("Method Not Allowed");
  });

  test("不正な JSON は 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("PUT", "not json"),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Invalid JSON");
  });

  test("スキーマ違反（action が exclude / hit 以外）は 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest(
        "PUT",
        JSON.stringify([
          { attackerMoveId: "a", defenderMoveId: "b", action: "force" },
        ]),
      ),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Validation failed");
  });
});
