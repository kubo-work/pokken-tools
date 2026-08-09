import { describe, expect, test } from "bun:test";
import {
  damageValueHitCount,
  hitBreakdownDefines,
  hitBreakdownTotalHitCount,
  isBaseDamageMultiHit,
} from "@/lib/moves/moveRules";
import type { HitBreakdownEntry } from "@/types/move";
import { gardevoirBreakdown, meditationBreakdown } from "./testFixtures";

describe("hitBreakdownDefines", () => {
  test("いずれかのグループでフィールドが設定されていれば true", () => {
    expect(hitBreakdownDefines(gardevoirBreakdown, "baseDamage")).toBe(true);
    expect(hitBreakdownDefines(gardevoirBreakdown, "guardLevel")).toBe(true);
  });

  test("どのグループにも設定されていなければ false", () => {
    expect(hitBreakdownDefines(meditationBreakdown, "chipDamage")).toBe(
      false,
    );
    expect(hitBreakdownDefines(meditationBreakdown, "guardLevel")).toBe(
      false,
    );
  });

  test("entries が undefined なら false", () => {
    expect(hitBreakdownDefines(undefined, "baseDamage")).toBe(false);
  });
});

describe("hitBreakdownTotalHitCount", () => {
  test("瞑想3段階アシストパワーの総ヒット数: 1 + 3 = 4", () => {
    expect(hitBreakdownTotalHitCount(meditationBreakdown)).toBe(4);
  });

  test("値を定義していないグループも hitCount として数える", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, baseDamage: 10 },
      { hitCount: 2 },
    ];
    expect(hitBreakdownTotalHitCount(entries)).toBe(3);
  });
});

describe("damageValueHitCount", () => {
  test("単一値（number）は常に1", () => {
    expect(damageValueHitCount(40)).toBe(1);
  });

  test("多段表記は hitCount", () => {
    expect(damageValueHitCount({ perHit: 40, hitCount: 2 })).toBe(2);
  });

  test("未設定は0", () => {
    expect(damageValueHitCount(undefined)).toBe(0);
  });
});

describe("isBaseDamageMultiHit", () => {
  test("単一値の baseDamage は false", () => {
    expect(isBaseDamageMultiHit(40, undefined)).toBe(false);
  });

  test("多段表記の baseDamage は true", () => {
    expect(isBaseDamageMultiHit({ perHit: 40, hitCount: 2 }, undefined)).toBe(
      true,
    );
  });

  test("baseDamage 未設定・hitBreakdown 無しは false", () => {
    expect(isBaseDamageMultiHit(undefined, undefined)).toBe(false);
  });

  test("hitBreakdown が baseDamage を定義していれば内訳の総ヒット数で判定する", () => {
    expect(isBaseDamageMultiHit(undefined, meditationBreakdown)).toBe(true);
  });

  test("hitBreakdown が baseDamage を定義していなければ単一値側で判定する", () => {
    const entries: HitBreakdownEntry[] = [{ hitCount: 1, guardLevel: "high" }];
    expect(isBaseDamageMultiHit(40, entries)).toBe(false);
    expect(
      isBaseDamageMultiHit({ perHit: 40, hitCount: 2 }, entries),
    ).toBe(true);
  });
});
