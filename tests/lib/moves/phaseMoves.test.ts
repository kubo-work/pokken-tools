import { describe, expect, test } from "bun:test";
import { getMovesByPhase } from "@/lib/moves/phaseMoves";
import { makeMove } from "./testFixtures";
import type { Character } from "@/types/character";

const character: Character = {
  id: "test_character",
  name: "テストキャラ",
  duelMoves: [makeMove({ id: "duel_move" })],
  fieldMoves: [makeMove({ id: "field_move" })],
  commonMoves: [makeMove({ id: "common_move" })],
};

describe("getMovesByPhase", () => {
  test("duel を正しく返す", () => {
    expect(getMovesByPhase(character, "duel")).toEqual(character.duelMoves);
  });

  test("field を正しく返す", () => {
    expect(getMovesByPhase(character, "field")).toEqual(character.fieldMoves);
  });

  test("common を正しく返す", () => {
    expect(getMovesByPhase(character, "common")).toEqual(character.commonMoves);
  });
});
