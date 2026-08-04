import { describe, expect, test } from "bun:test";
import {
  hitBreakdownDefines,
  totalHitBreakdownDamage,
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

describe("totalHitBreakdownDamage", () => {
  test("瞑想3段階アシストパワーの合計: 50 + 45*3 = 185", () => {
    expect(totalHitBreakdownDamage(meditationBreakdown, "baseDamage")).toBe(
      185,
    );
  });

  test("サーナイト8Yの合計: 60 + 60*3 = 240", () => {
    expect(totalHitBreakdownDamage(gardevoirBreakdown, "baseDamage")).toBe(
      240,
    );
  });

  test("どのグループにも値が無ければ undefined", () => {
    expect(
      totalHitBreakdownDamage(meditationBreakdown, "guardCrushValue"),
    ).toBeUndefined();
  });

  test("一部のグループだけ値がある場合、未設定グループは0として合算", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, baseDamage: 10 },
      { hitCount: 2 },
    ];
    expect(totalHitBreakdownDamage(entries, "baseDamage")).toBe(10);
  });
});
