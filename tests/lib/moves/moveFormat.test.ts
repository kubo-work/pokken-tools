import { describe, expect, test } from "bun:test";
import { formatHitBreakdownValue } from "@/lib/moves/moveFormat";
import type { HitBreakdownEntry } from "@/types/move";
import { gardevoirBreakdown, meditationBreakdown } from "./testFixtures";

describe("formatHitBreakdownValue", () => {
  test("瞑想3段階アシストパワー: 50+45×3", () => {
    expect(formatHitBreakdownValue(meditationBreakdown, "baseDamage")).toBe(
      "50+45×3",
    );
  });

  test("サーナイト8Y: 60+60×3", () => {
    expect(formatHitBreakdownValue(gardevoirBreakdown, "baseDamage")).toBe(
      "60+60×3",
    );
  });

  test("未設定のグループは - になる", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, baseDamage: 10 },
      { hitCount: 2 },
    ];
    expect(formatHitBreakdownValue(entries, "chipDamage")).toBe("-+-");
  });

  test("PCH値もダメージ系と同じ形式で連結する", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, phaseChangePoints: 30 },
      { hitCount: 3, phaseChangePoints: 10 },
    ];
    expect(formatHitBreakdownValue(entries, "phaseChangePoints")).toBe(
      "30+10×3",
    );
  });
});
