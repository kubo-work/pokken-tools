import { describe, expect, test } from "bun:test";
import type { Character } from "@/types/character";
import { buildCharacterTiles } from "@/lib/characterTiles";
import { CHARACTER_REGISTRY } from "@/lib/characters/registry";
import { makeMove } from "./moves/testFixtures";

interface MoveCounts {
  field: number;
  duel: number;
  common: number;
}

/** 指定した技数だけを持つキャラ。件数の集計だけが対象なので技の中身は問わない。 */
const makeCharacter = (id: string, counts: MoveCounts): Character => ({
  id,
  // registry と異なる名前を入れ、タイルの表示名がどちらから来るかを検証できるようにする。
  name: `${id}-from-kv`,
  fieldMoves: Array.from({ length: counts.field }, (_, index) =>
    makeMove({ id: `${id}_field_${index}` }),
  ),
  duelMoves: Array.from({ length: counts.duel }, (_, index) =>
    makeMove({ id: `${id}_duel_${index}` }),
  ),
  commonMoves: Array.from({ length: counts.common }, (_, index) =>
    makeMove({ id: `${id}_common_${index}` }),
  ),
});

describe("buildCharacterTiles", () => {
  test("registry の全キャラ分のタイルを返す", () => {
    expect(buildCharacterTiles([])).toHaveLength(CHARACTER_REGISTRY.length);
  });

  test("引数の並び順ではなく registry の順序を保つ", () => {
    // registry では pikachu → pikachu_libre → lucario の順。逆順で渡して確認する。
    const tiles = buildCharacterTiles([
      makeCharacter("lucario", { field: 1, duel: 1, common: 1 }),
      makeCharacter("pikachu", { field: 1, duel: 1, common: 1 }),
    ]);
    expect(tiles.map((tile) => tile.id)).toEqual(
      CHARACTER_REGISTRY.map((entry) => entry.id),
    );
  });

  test("技数をフェイズごとに数える", () => {
    const tiles = buildCharacterTiles([
      makeCharacter("pikachu", { field: 2, duel: 3, common: 1 }),
    ]);
    const pikachu = tiles.find((tile) => tile.id === "pikachu");
    expect(pikachu).toEqual({
      id: "pikachu",
      name: "ピカチュウ",
      field: 2,
      duel: 3,
      common: 1,
    });
  });

  test("KV 未投入のキャラは 0 で埋める", () => {
    const tiles = buildCharacterTiles([
      makeCharacter("pikachu", { field: 2, duel: 3, common: 1 }),
    ]);
    const gengar = tiles.find((tile) => tile.id === "gengar");
    expect(gengar).toEqual({
      id: "gengar",
      name: "ゲンガー",
      field: 0,
      duel: 0,
      common: 0,
    });
  });

  test("表示名は KV の値ではなく registry の値を使う", () => {
    const tiles = buildCharacterTiles([
      makeCharacter("pikachu", { field: 0, duel: 0, common: 0 }),
    ]);
    expect(tiles.find((tile) => tile.id === "pikachu")?.name).toBe("ピカチュウ");
  });

  test("registry に無い ID を渡しても結果に混入しない", () => {
    const tiles = buildCharacterTiles([
      makeCharacter("unknown_character", { field: 5, duel: 5, common: 5 }),
    ]);
    expect(tiles).toHaveLength(CHARACTER_REGISTRY.length);
    expect(tiles.some((tile) => tile.id === "unknown_character")).toBe(false);
  });
});
