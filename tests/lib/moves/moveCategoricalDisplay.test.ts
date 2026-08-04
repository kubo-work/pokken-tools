import { describe, expect, test } from "bun:test";
import {
  hitBreakdownCategoricalLines,
  moveAirGroundJudgmentLabel,
  moveGuardLevelShortLabel,
} from "@/lib/moves/moveCategoricalDisplay";
import type { HitBreakdownEntry, Move } from "@/types/move";
import {
  gardevoirBreakdown,
  makeMove,
  meditationBreakdown,
} from "./testFixtures";

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

/** 一覧向けサマリーのテストは技の識別子を問わないため、id を固定して makeMove に委ねる。 */
const buildMove = (overrides: Partial<Move>): Move =>
  makeMove({ id: "test_move", ...overrides });

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
