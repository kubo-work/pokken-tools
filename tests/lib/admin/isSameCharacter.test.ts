import { describe, expect, test } from "bun:test";
import { isSameCharacter } from "@/lib/admin/isSameCharacter";
import { createMove } from "@/lib/factory";
import type { Character } from "@/types/character";

const buildCharacter = (): Character => ({
  id: "pikachu",
  name: "ピカチュウ",
  fieldMoves: [createMove("pikachu", "field")],
  duelMoves: [createMove("pikachu", "duel"), createMove("pikachu", "duel")],
  commonMoves: [],
});

describe("isSameCharacter", () => {
  test("同じ内容の別オブジェクトは同一とみなす", () => {
    const character = buildCharacter();
    expect(isSameCharacter(character, structuredClone(character))).toBe(true);
  });

  test("キャラ名が違えば別物とみなす", () => {
    const character = buildCharacter();
    expect(isSameCharacter(character, { ...character, name: "ライチュウ" })).toBe(
      false,
    );
  });

  test("技の中身が違えば別物とみなす", () => {
    const character = buildCharacter();
    const [firstMove, ...restMoves] = character.duelMoves;
    const edited: Character = {
      ...character,
      duelMoves: [{ ...firstMove, name: "でんきショック" }, ...restMoves],
    };
    expect(isSameCharacter(character, edited)).toBe(false);
  });

  test("技の並び順が違えば別物とみなす", () => {
    const character = buildCharacter();
    const reordered: Character = {
      ...character,
      duelMoves: [...character.duelMoves].reverse(),
    };
    expect(isSameCharacter(character, reordered)).toBe(false);
  });

  test("キーの順序の違いは無視する", () => {
    const character = buildCharacter();
    const reorderedKeys: Character = {
      commonMoves: character.commonMoves,
      duelMoves: character.duelMoves,
      fieldMoves: character.fieldMoves,
      name: character.name,
      id: character.id,
    };
    expect(isSameCharacter(character, reorderedKeys)).toBe(true);
  });

  test("値が undefined のキーはキーが無いのと同じとみなす", () => {
    // 任意項目を入力して消すと undefined のキーが残るが、保存される JSON は変わらないため
    const character = buildCharacter();
    const [firstMove, ...restMoves] = character.duelMoves;
    const withUndefinedKey: Character = {
      ...character,
      duelMoves: [{ ...firstMove, activeUntilFrame: undefined }, ...restMoves],
    };
    expect(isSameCharacter(character, withUndefinedKey)).toBe(true);
  });

  test("編集して元の値に戻せば同一とみなす", () => {
    const character = buildCharacter();
    const renamed = { ...character, name: "ライチュウ" };
    const restored = { ...renamed, name: character.name };
    expect(isSameCharacter(character, restored)).toBe(true);
  });
});
