import { describe, expect, test } from "bun:test";
import {
  formatHitBreakdownCategorical,
  formatHitBreakdownDamage,
  hitBreakdownDefines,
  totalHitBreakdownDamage,
} from "@/lib/meta";
import type { HitBreakdownEntry } from "@/types/move";

/** 瞑想3段階アシストパワー相当: 1ヒット目50、2〜4ヒット目45×3。 */
const meditationBreakdown: HitBreakdownEntry[] = [
  { hitCount: 1, baseDamage: 50 },
  { hitCount: 3, baseDamage: 45 },
];

/** サーナイト8Y相当: 1ヒット目60・上段、2〜4ヒット目60×3・空。 */
const gardevoirBreakdown: HitBreakdownEntry[] = [
  { hitCount: 1, baseDamage: 60, guardLevel: "high" },
  { hitCount: 3, baseDamage: 60, airGroundJudgment: "air" },
];

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

describe("formatHitBreakdownDamage", () => {
  test("瞑想3段階アシストパワー: 50+45×3", () => {
    expect(formatHitBreakdownDamage(meditationBreakdown, "baseDamage")).toBe(
      "50+45×3",
    );
  });

  test("サーナイト8Y: 60+60×3", () => {
    expect(formatHitBreakdownDamage(gardevoirBreakdown, "baseDamage")).toBe(
      "60+60×3",
    );
  });

  test("未設定のグループは - になる", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, baseDamage: 10 },
      { hitCount: 2 },
    ];
    expect(formatHitBreakdownDamage(entries, "chipDamage")).toBe("-+-");
  });
});

describe("formatHitBreakdownCategorical", () => {
  test("サーナイト8Y の guardLevel: 1: 上段", () => {
    expect(
      formatHitBreakdownCategorical(gardevoirBreakdown, "guardLevel"),
    ).toBe("1: 上段");
  });

  test("サーナイト8Y の airGroundJudgment: 2〜4: 空", () => {
    expect(
      formatHitBreakdownCategorical(gardevoirBreakdown, "airGroundJudgment"),
    ).toBe("2〜4: 空");
  });

  test("どのグループにも値が無ければ空文字", () => {
    expect(
      formatHitBreakdownCategorical(meditationBreakdown, "guardLevel"),
    ).toBe("");
  });

  test("単一ヒットのグループは範囲表記にならない", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, guardLevel: "high" },
      { hitCount: 1, guardLevel: "low" },
    ];
    expect(formatHitBreakdownCategorical(entries, "guardLevel")).toBe(
      "1: 上段 / 2: 下段",
    );
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
