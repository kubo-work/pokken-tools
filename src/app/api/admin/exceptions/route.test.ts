import { describe, expect, test } from "bun:test";
import { errorMessageOf } from "@/app/api/admin/testHelpers";
import { PUT } from "./route";

/** setExceptions（KV 書き込み）に到達するのはバリデーション成功時のみなので対象外。 */
describe("PUT /api/admin/exceptions", () => {
  test("不正な JSON は 400", async () => {
    const request = new Request("http://localhost/api/admin/exceptions", {
      method: "PUT",
      body: "not json",
    });
    const response = await PUT(request);
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Invalid JSON");
  });

  test("スキーマ違反（action が exclude / hit 以外）は 400", async () => {
    const request = new Request("http://localhost/api/admin/exceptions", {
      method: "PUT",
      body: JSON.stringify([
        { attackerMoveId: "a", defenderMoveId: "b", action: "force" },
      ]),
    });
    const response = await PUT(request);
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Validation failed");
  });
});
