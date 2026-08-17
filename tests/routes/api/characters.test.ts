import { describe, expect, test } from "bun:test";
import {
  errorMessageOf,
  invokeAction,
  invokeLoader,
  mockAuthenticatedApiUser,
} from "../../helpers/apiRoute";
import { runWithRecordingKv, runWithRecordingKvPut } from "../../helpers/kvEnv";
import { KV_KEYS } from "@/lib/kv/keys";
import { CHARACTER_REGISTRY } from "@/lib/characters/registry";

mockAuthenticatedApiUser();
const { loader, action } = await import("../../../app/routes/api/characters");

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

const makeCharacter = (id: string, name: string) => ({
  id,
  name,
  fieldMoves: [],
  duelMoves: [validMove],
  commonMoves: [],
});

const makeRequest = (body: unknown, method = "PUT"): Request =>
  new Request("http://localhost/api/admin/characters", {
    method,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("GET /api/admin/characters", () => {
  test("registry 全キャラと exceptions をバンドル形で返す", async () => {
    const { result } = await runWithRecordingKv(async () => {
      const request = new Request("http://localhost/api/admin/characters", {
        method: "GET",
      });
      const response = await invokeLoader(loader, { request });
      return response.json() as Promise<{
        version: number;
        exportedAt: string;
        characters: unknown[];
        exceptions: unknown[];
      }>;
    });
    expect(result.version).toBe(1);
    expect(typeof result.exportedAt).toBe("string");
    expect(result.characters).toHaveLength(CHARACTER_REGISTRY.length);
    expect(result.exceptions).toEqual([]);
  });
});

describe("PUT /api/admin/characters", () => {
  test("PUT 以外のメソッドは 405", async () => {
    const response = await invokeAction(action, {
      request: makeRequest([makeCharacter("pikachu", "ピカチュウ")], "POST"),
    });
    expect(response.status).toBe(405);
    expect(await errorMessageOf(response)).toBe("Method Not Allowed");
  });

  test("不正な JSON は 400", async () => {
    const response = await invokeAction(action, {
      request: makeRequest("not json"),
    });
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Invalid JSON");
  });

  test("スキーマ違反（characters が空配列）は 400 で KV は無変更", async () => {
    const { result: response, puts } = await runWithRecordingKvPut(() =>
      invokeAction(action, {
        request: makeRequest({
          version: 1,
          exportedAt: "2026-08-17T00:00:00.000Z",
          characters: [],
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await errorMessageOf(response)).toBe("Validation failed");
    expect(puts).toHaveLength(0);
  });

  test("成功時はファイルに含まれるキャラだけ保存し、savedCharacterIds を返す", async () => {
    const { result: response, puts } = await runWithRecordingKvPut(() =>
      invokeAction(action, {
        request: makeRequest({
          version: 1,
          exportedAt: "2026-08-17T00:00:00.000Z",
          characters: [
            makeCharacter("pikachu", "ピカチュウ"),
            makeCharacter("lucario", "ルカリオ"),
          ],
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ok: boolean;
      savedCharacterIds: string[];
      exceptionsApplied: boolean;
    };
    expect(body.ok).toBe(true);
    expect(body.savedCharacterIds.sort()).toEqual(["lucario", "pikachu"]);
    expect(body.exceptionsApplied).toBe(false);
    expect(puts.map((put) => put.key).sort()).toEqual(
      [KV_KEYS.character("pikachu"), KV_KEYS.character("lucario")].sort(),
    );
  });

  test("exceptions を含めると exceptions も保存し exceptionsApplied が true になる", async () => {
    const { result: response, puts } = await runWithRecordingKvPut(() =>
      invokeAction(action, {
        request: makeRequest({
          version: 1,
          exportedAt: "2026-08-17T00:00:00.000Z",
          characters: [makeCharacter("pikachu", "ピカチュウ")],
          exceptions: [
            { attackerMoveId: "a", defenderMoveId: "b", action: "exclude" },
          ],
        }),
      }),
    );
    const body = (await response.json()) as { exceptionsApplied: boolean };
    expect(body.exceptionsApplied).toBe(true);
    expect(puts.map((put) => put.key)).toContain(KV_KEYS.exceptions);
  });

  test("一部のキャラの KV 書き込みが失敗すると 500 で failedCharacterIds を返す", async () => {
    const { result: response } = await runWithRecordingKvPut(
      () =>
        invokeAction(action, {
          request: makeRequest({
            version: 1,
            exportedAt: "2026-08-17T00:00:00.000Z",
            characters: [
              makeCharacter("pikachu", "ピカチュウ"),
              makeCharacter("lucario", "ルカリオ"),
            ],
          }),
        }),
      { failKeys: new Set([KV_KEYS.character("lucario")]) },
    );
    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      savedCharacterIds: string[];
      failedCharacterIds: string[];
    };
    expect(body.savedCharacterIds).toEqual(["pikachu"]);
    expect(body.failedCharacterIds).toEqual(["lucario"]);
  });

  test("exceptions の KV 書き込みが失敗すると 500 で failedCharacterIds は空配列になる", async () => {
    const { result: response } = await runWithRecordingKvPut(
      () =>
        invokeAction(action, {
          request: makeRequest({
            version: 1,
            exportedAt: "2026-08-17T00:00:00.000Z",
            characters: [makeCharacter("pikachu", "ピカチュウ")],
            exceptions: [
              { attackerMoveId: "a", defenderMoveId: "b", action: "exclude" },
            ],
          }),
        }),
      { failKeys: new Set([KV_KEYS.exceptions]) },
    );
    expect(response.status).toBe(500);
    const body = (await response.json()) as {
      error: string;
      savedCharacterIds: string[];
      failedCharacterIds: string[];
      exceptionsApplied: boolean;
    };
    expect(body.savedCharacterIds).toEqual(["pikachu"]);
    expect(body.failedCharacterIds).toEqual([]);
    expect(body.exceptionsApplied).toBe(false);
  });
});
