import { describe, expect, test } from "bun:test";
import { getRegistryEntry, isKnownCharacterId } from "@/lib/characters/registry";

describe("isKnownCharacterId", () => {
  test("登録済みのキャラ id は true", () => {
    expect(isKnownCharacterId("pikachu")).toBe(true);
  });

  test("未登録の id は false", () => {
    expect(isKnownCharacterId("not_a_character")).toBe(false);
  });

  test("prototype チェーン経由で解決する名前は false（constructor / __proto__）", () => {
    // REGISTRY_BY_ID[id] !== undefined での判定だと、これらは Object.prototype
    // 由来の値が見えてしまい誤って true になる。Object.hasOwn ならどちらも false。
    expect(isKnownCharacterId("constructor")).toBe(false);
    expect(isKnownCharacterId("__proto__")).toBe(false);
    expect(isKnownCharacterId("toString")).toBe(false);
    expect(isKnownCharacterId("hasOwnProperty")).toBe(false);
  });
});

describe("getRegistryEntry", () => {
  test("登録済みのキャラ id はエントリを返す", () => {
    expect(getRegistryEntry("pikachu")).toEqual({
      id: "pikachu",
      name: "ピカチュウ",
    });
  });

  test("未登録の id は undefined", () => {
    expect(getRegistryEntry("not_a_character")).toBeUndefined();
  });

  test("prototype チェーン経由で解決する名前は undefined（constructor / __proto__）", () => {
    // isKnownCharacterId と同じ理由。ここが素通しのままだと、getCharacter の
    // 「registry にも無い ID のときだけ undefined を返す」という JSDoc 上の約束が破れ、
    // constructor 等が Object.prototype 由来のエントリとして拾われてしまう。
    expect(getRegistryEntry("constructor")).toBeUndefined();
    expect(getRegistryEntry("__proto__")).toBeUndefined();
    expect(getRegistryEntry("toString")).toBeUndefined();
    expect(getRegistryEntry("hasOwnProperty")).toBeUndefined();
  });
});
