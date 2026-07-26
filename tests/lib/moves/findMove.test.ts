import { describe, expect, test } from "bun:test";
import { findMoveInCharacter } from "@/lib/moves/findMove";
import { makeMove } from "./testFixtures";
import type { Character } from "@/types/character";

const duelParent = makeMove({ id: "duel_parent" });
const duelChild = makeMove({
  id: "duel_child",
  variant: "derivative",
  parentMoveId: "duel_parent",
});
const orphanChild = makeMove({
  id: "orphan_child",
  variant: "derivative",
  parentMoveId: "missing_parent",
});
const fieldMove = makeMove({ id: "field_move" });

const character: Character = {
  id: "test_character",
  name: "テストキャラ",
  duelMoves: [duelParent, duelChild, orphanChild],
  fieldMoves: [fieldMove],
};

describe("findMoveInCharacter", () => {
  test("デュエルの親技は phase=duel・parent なしで返る", () => {
    expect(findMoveInCharacter(character, "duel_parent")).toEqual({
      move: duelParent,
      parent: undefined,
      phase: "duel",
    });
  });

  test("子技は同フェイズ内で親技を解決する", () => {
    expect(findMoveInCharacter(character, "duel_child")).toEqual({
      move: duelChild,
      parent: duelParent,
      phase: "duel",
    });
  });

  test("親技が見つからない子技は parent が undefined になる", () => {
    expect(findMoveInCharacter(character, "orphan_child")).toEqual({
      move: orphanChild,
      parent: undefined,
      phase: "duel",
    });
  });

  test("フィールド技は phase=field で返る", () => {
    expect(findMoveInCharacter(character, "field_move")).toEqual({
      move: fieldMove,
      parent: undefined,
      phase: "field",
    });
  });

  test("同じ id が両フェイズにある場合はデュエルを優先する", () => {
    const duplicated = makeMove({ id: "duplicated" });
    const characterWithDuplicate: Character = {
      id: "test_character",
      name: "テストキャラ",
      duelMoves: [duplicated],
      fieldMoves: [makeMove({ id: "duplicated", name: "field_side" })],
    };
    const found = findMoveInCharacter(characterWithDuplicate, "duplicated");
    expect(found?.phase).toBe("duel");
    expect(found?.move).toBe(duplicated);
  });

  test("見つからない id は undefined を返す", () => {
    expect(findMoveInCharacter(character, "unknown")).toBeUndefined();
  });
});
