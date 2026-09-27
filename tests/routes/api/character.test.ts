import { describe, expect, test } from "bun:test";
import {
  errorMessageOf,
  invokeAction,
  mockAuthenticatedApiUser,
} from "../../helpers/apiRoute";

mockAuthenticatedApiUser();
const { action } = await import("../../../app/routes/api/character");

/**
 * setCharacter（KV 書き込み）に到達するのは検証成功時のみなので、
 * ここでは KV をモックせずに検証できる 4xx 分岐だけを対象にする。
 */
const makeRequest = (body: unknown, method = "PUT"): Request =>
  new Request("http://localhost/api/admin/characters/pikachu", {
    method,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const validMove = {
  id: "move",
  name: "テスト技",
  command: "Y",
  category: "attack",
  attackType: "strike",
  guardLevel: "mid",
  startup: 10,
  guardFrameAdvantage: -5,
  strength: 1,
};

const validCharacter = {
  id: "pikachu",
  name: "ピカチュウ",
  fieldMoves: [],
  duelMoves: [validMove],
  commonMoves: [],
};

describe("PUT /api/admin/characters/:id", () => {
  test("PUT 以外のメソッドは 405", async () => {
    const response = await invokeAction(action, {
      request: makeRequest(validCharacter, "POST"),
      params: { id: "pikachu" },
    });
    expect(response.status).toBe(405);
    expect(await errorMessageOf(response)).toBe("Method Not Allowed");
  });

  test("未知のキャラ ID は 404", async () => {
    const response = await invokeAction(action, {
      request: makeRequest(validCharacter),
      params: { id: "unknown_character" },
    });
    expect(response.status).toBe(404);
    expect(await errorMessageOf(response)).toBe("Unknown character id");
  });

  test("不正な JSON は 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("not json"),
      params: { id: "pikachu" },
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Invalid JSON");
  });

  test("スキーマ違反は 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest({ ...validCharacter, name: "" }),
      params: { id: "pikachu" },
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Validation failed");
  });

  test("技 id が重複していると 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest({
        ...validCharacter,
        duelMoves: [validMove],
        commonMoves: [validMove],
      }),
      params: { id: "pikachu" },
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Validation failed");
  });

  test("path の id と body の id が食い違うと 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest({ ...validCharacter, id: "lucario" }),
      params: { id: "pikachu" },
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Path id and body id mismatch");
  });
});
