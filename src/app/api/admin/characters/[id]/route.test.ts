import { describe, expect, test } from "bun:test";
import { errorMessageOf } from "@/app/api/admin/testHelpers";
import { PUT } from "./route";

/**
 * setCharacter（KV 書き込み）に到達するのはバリデーション成功時のみなので、
 * ここでは KV をモックせずに検証できる 4xx 分岐だけを対象にする。
 */
const makeRequest = (body: unknown): Request =>
  new Request("http://localhost/api/admin/characters/pikachu", {
    method: "PUT",
    body: JSON.stringify(body),
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
};

describe("PUT /api/admin/characters/[id]", () => {
  test("未知のキャラ ID は 404", async () => {
    const response = await PUT(makeRequest(validCharacter), {
      params: Promise.resolve({ id: "unknown_character" }),
    });
    expect(response.status).toBe(404);
  });

  test("不正な JSON は 400", async () => {
    const request = new Request("http://localhost/api/admin/characters/pikachu", {
      method: "PUT",
      body: "not json",
    });
    const response = await PUT(request, {
      params: Promise.resolve({ id: "pikachu" }),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Invalid JSON");
  });

  test("スキーマ違反は 400", async () => {
    const response = await PUT(
      makeRequest({ ...validCharacter, name: "" }),
      { params: Promise.resolve({ id: "pikachu" }) },
    );
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Validation failed");
  });

  test("path の id と body の id が食い違うと 400", async () => {
    const response = await PUT(
      makeRequest({ ...validCharacter, id: "lucario" }),
      { params: Promise.resolve({ id: "pikachu" }) },
    );
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe(
      "Path id and body id mismatch",
    );
  });
});
