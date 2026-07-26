import { describe, expect, test } from "bun:test";
import {
  formatHitBreakdownDamage,
  hitBreakdownCategoricalLines,
  hitBreakdownDefines,
  moveAirGroundJudgmentLabel,
  moveGuardLevelShortLabel,
  totalHitBreakdownDamage,
} from "@/lib/meta";
import type { HitBreakdownEntry, Move } from "@/types/move";

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

describe("hitBreakdownCategoricalLines", () => {
  test("サーナイト8Y の guardLevel: 1ヒット目: 上段", () => {
    expect(
      hitBreakdownCategoricalLines(gardevoirBreakdown, "guardLevel"),
    ).toEqual(["1ヒット目: 上段"]);
  });

  test("サーナイト8Y の airGroundJudgment: 2〜4ヒット目: 空", () => {
    expect(
      hitBreakdownCategoricalLines(gardevoirBreakdown, "airGroundJudgment"),
    ).toEqual(["2〜4ヒット目: 空"]);
  });

  test("どのグループにも値が無ければ空配列", () => {
    expect(
      hitBreakdownCategoricalLines(meditationBreakdown, "guardLevel"),
    ).toEqual([]);
  });

  test("単一ヒットのグループは範囲表記にならず、グループごとに行が分かれる", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, guardLevel: "high" },
      { hitCount: 1, guardLevel: "low" },
    ];
    expect(hitBreakdownCategoricalLines(entries, "guardLevel")).toEqual([
      "1ヒット目: 上段",
      "2ヒット目: 下段",
    ]);
  });
});

/** 一覧向けサマリーのテスト用に最小限の必須フィールドを持つ技を作る。 */
const buildMove = (overrides: Partial<Move>): Move => ({
  id: "test_move",
  name: "テスト技",
  command: "5Y",
  guardLevel: null,
  startup: 10,
  guardFrameAdvantage: -5,
  ...overrides,
});

describe("moveGuardLevelShortLabel（一覧向け）", () => {
  test("ヒット内訳がある技は値だけを表示し、ヒット位置を出さない", () => {
    expect(
      moveGuardLevelShortLabel(buildMove({ hitBreakdown: gardevoirBreakdown })),
    ).toBe("上");
  });

  test("グループごとに値が違えば重複を除いて / で連結する", () => {
    const move = buildMove({
      hitBreakdown: [
        { hitCount: 1, guardLevel: "high" },
        { hitCount: 1, guardLevel: "low" },
        { hitCount: 1, guardLevel: "low" },
      ],
    });
    expect(moveGuardLevelShortLabel(move)).toBe("上/下");
  });

  test("内訳が guardLevel を定義していなければ技単位の代表値", () => {
    const move = buildMove({
      guardLevel: "mid",
      hitBreakdown: meditationBreakdown,
    });
    expect(moveGuardLevelShortLabel(move)).toBe("中");
  });

  test("guardLevel が null で内訳も無ければ undefined", () => {
    expect(moveGuardLevelShortLabel(buildMove({}))).toBeUndefined();
  });
});

describe("moveAirGroundJudgmentLabel（一覧向け）", () => {
  test("ヒット内訳がある技は値だけを表示し、ヒット位置を出さない", () => {
    expect(
      moveAirGroundJudgmentLabel(
        buildMove({ hitBreakdown: gardevoirBreakdown }),
      ),
    ).toBe("空");
  });

  test("内訳が無ければ技単位の値", () => {
    expect(
      moveAirGroundJudgmentLabel(buildMove({ airGroundJudgment: "ground" })),
    ).toBe("地");
  });

  test("どちらも無ければ undefined", () => {
    expect(moveAirGroundJudgmentLabel(buildMove({}))).toBeUndefined();
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
