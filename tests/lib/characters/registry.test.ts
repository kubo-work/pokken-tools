import { describe, expect, test } from "bun:test";
import { isKnownCharacterId } from "@/lib/characters/registry";

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
