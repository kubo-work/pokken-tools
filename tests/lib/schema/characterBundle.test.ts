import { describe, expect, test } from "bun:test";
import { characterBundleSchema } from "@/lib/schema";

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

const validException = {
  attackerMoveId: "a",
  defenderMoveId: "b",
  action: "exclude" as const,
};

describe("characterBundleSchema", () => {
  test("version 1・既知キャラ・exceptions 省略で通る", () => {
    const result = characterBundleSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-17T00:00:00.000Z",
      characters: [makeCharacter("pikachu", "ピカチュウ")],
    });
    expect(result.success).toBe(true);
  });

  test("exceptions を含めても通る", () => {
    const result = characterBundleSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-17T00:00:00.000Z",
      characters: [makeCharacter("pikachu", "ピカチュウ")],
      exceptions: [validException],
    });
    expect(result.success).toBe(true);
  });

  test("version が 1 以外は弾く", () => {
    const result = characterBundleSchema.safeParse({
      version: 2,
      exportedAt: "2026-08-17T00:00:00.000Z",
      characters: [makeCharacter("pikachu", "ピカチュウ")],
    });
    expect(result.success).toBe(false);
  });

  test("characters が空配列は弾く", () => {
    const result = characterBundleSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-17T00:00:00.000Z",
      characters: [],
    });
    expect(result.success).toBe(false);
  });

  test("registry に無い id は弾く", () => {
    const result = characterBundleSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-17T00:00:00.000Z",
      characters: [makeCharacter("not_a_character", "謎")],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (candidate) =>
          candidate.path[0] === "characters" && candidate.path[2] === "id",
      );
      expect(issue?.path).toEqual(["characters", 0, "id"]);
    }
  });

  test("複数キャラが同時に不正な場合は各キャラ分の issue を集約して返す", () => {
    const result = characterBundleSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-17T00:00:00.000Z",
      characters: [
        makeCharacter("not_a_character", "謎1"),
        makeCharacter("also_unknown", "謎2"),
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const idIssues = result.error.issues.filter(
        (candidate) =>
          candidate.path[0] === "characters" && candidate.path[2] === "id",
      );
      expect(idIssues).toHaveLength(2);
      expect(idIssues.map((issue) => issue.path)).toEqual([
        ["characters", 0, "id"],
        ["characters", 1, "id"],
      ]);
    }
  });

  test("characters 内で id が重複していれば弾く", () => {
    const result = characterBundleSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-17T00:00:00.000Z",
      characters: [
        makeCharacter("pikachu", "ピカチュウ"),
        makeCharacter("pikachu", "ピカチュウ2"),
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (candidate) => candidate.path[1] === 1,
      );
      expect(issue?.path).toEqual(["characters", 1, "id"]);
    }
  });

  test("キャラ内で技 id が重複していれば弾く", () => {
    const result = characterBundleSchema.safeParse({
      version: 1,
      exportedAt: "2026-08-17T00:00:00.000Z",
      characters: [
        {
          ...makeCharacter("pikachu", "ピカチュウ"),
          duelMoves: [validMove, validMove],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual([
        ["characters", 0, "duelMoves", 1, "id"],
      ]);
    }
  });
});
