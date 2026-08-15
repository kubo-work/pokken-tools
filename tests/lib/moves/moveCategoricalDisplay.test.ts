import { describe, expect, test } from "bun:test";
import {
  hitBreakdownCategoricalLines,
  moveAirGroundJudgmentLabel,
  moveAttackTypeLines,
  moveAttackTypeShortLabel,
  moveGuardLevelShortLabel,
  moveResonanceFlinchLines,
  moveStrengthBadgeLabel,
  moveStrengthLines,
  moveStrengthShortLabel,
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

describe("moveResonanceFlinchLines（詳細ページ向け）", () => {
  test("内訳が共鳴怯ませを定義していればヒット範囲ごとの行になる", () => {
    const move = buildMove({
      hitBreakdown: [
        { hitCount: 1, resonanceFlinch: "weak" },
        { hitCount: 3, resonanceFlinch: "strong" },
      ],
    });
    expect(moveResonanceFlinchLines(move)).toEqual([
      "1ヒット目: 弱",
      "2〜4ヒット目: 強",
    ]);
  });

  test("内訳が共鳴怯ませを定義していなければ技単位の代表値", () => {
    const move = buildMove({
      resonanceFlinch: "strong",
      hitBreakdown: meditationBreakdown,
    });
    expect(moveResonanceFlinchLines(move)).toEqual(["強"]);
  });

  test("技単位が切替形式なら持続フレーム付きの表記になる", () => {
    const move = buildMove({ resonanceFlinch: { switchActiveFrame: 5 } });
    expect(moveResonanceFlinchLines(move)).toEqual(["弱→強（持続5〜）"]);
  });

  test("内訳も技単位も無ければ空配列", () => {
    expect(moveResonanceFlinchLines(buildMove({}))).toEqual([]);
  });
});

describe("moveAttackTypeLines（詳細ページ向け）", () => {
  test("内訳が攻撃属性を定義していればヒット範囲ごとの行になる", () => {
    const move = buildMove({
      hitBreakdown: [
        { hitCount: 1, attackType: "strike" },
        { hitCount: 3, attackType: "projectile" },
      ],
    });
    expect(moveAttackTypeLines(move)).toEqual([
      "1ヒット目: 打撃",
      "2〜4ヒット目: 弾",
    ]);
  });

  test("内訳が攻撃属性を定義していなければ技単位の代表値", () => {
    const move = buildMove({
      attackType: "strike",
      hitBreakdown: meditationBreakdown,
    });
    expect(moveAttackTypeLines(move)).toEqual(["打撃"]);
  });

  test("内訳も技単位も無ければ空配列", () => {
    expect(moveAttackTypeLines(buildMove({}))).toEqual([]);
  });
});

describe("moveAttackTypeShortLabel（一覧向け）", () => {
  test("ヒット内訳がある技は値だけを表示し、ヒット位置を出さない", () => {
    const move = buildMove({
      hitBreakdown: [
        { hitCount: 1, attackType: "strike" },
        { hitCount: 3, attackType: "projectile" },
      ],
    });
    expect(moveAttackTypeShortLabel(move)).toBe("打/弾");
  });

  test("内訳が無ければ技単位の値", () => {
    expect(
      moveAttackTypeShortLabel(buildMove({ attackType: "projectile" })),
    ).toBe("弾");
  });

  test("どちらも無ければ undefined", () => {
    expect(moveAttackTypeShortLabel(buildMove({}))).toBeUndefined();
  });
});

describe("moveStrengthLines（詳細ページ向け）", () => {
  test("内訳が強度を定義していればヒット範囲ごとの行になる", () => {
    const move = buildMove({
      hitBreakdown: [
        { hitCount: 1, strength: 5 },
        { hitCount: 3, strength: 3 },
      ],
    });
    expect(moveStrengthLines(move)).toEqual([
      "1ヒット目: 5",
      "2〜4ヒット目: 3",
    ]);
  });

  test("内訳が強度を定義していなければ技単位の代表値", () => {
    const move = buildMove({ strength: 4, hitBreakdown: meditationBreakdown });
    expect(moveStrengthLines(move)).toEqual(["4"]);
  });

  test("内訳も技単位も無ければ空配列", () => {
    expect(moveStrengthLines(buildMove({}))).toEqual([]);
  });
});

describe("moveStrengthShortLabel（一覧向け）", () => {
  test("ヒット内訳がある技は値だけを重複を除いて / で連結する", () => {
    const move = buildMove({
      hitBreakdown: [
        { hitCount: 1, strength: 5 },
        { hitCount: 1, strength: 3 },
        { hitCount: 1, strength: 3 },
      ],
    });
    expect(moveStrengthShortLabel(move)).toBe("5/3");
  });

  test("内訳が無ければ技単位の値", () => {
    expect(moveStrengthShortLabel(buildMove({ strength: 6 }))).toBe("6");
  });

  test("どちらも無ければ undefined", () => {
    expect(moveStrengthShortLabel(buildMove({}))).toBeUndefined();
  });

  test("記号の強度は ◎ / ● で表示される", () => {
    expect(moveStrengthLines(buildMove({ strength: "erase" }))).toEqual(["◎"]);
    expect(moveStrengthShortLabel(buildMove({ strength: "inert" }))).toBe("●");
  });

  test("内訳が数値と記号を混在させても値だけを連結する", () => {
    const move = buildMove({
      hitBreakdown: [
        { hitCount: 1, strength: 5 },
        { hitCount: 2, strength: "erase" },
      ],
    });
    expect(moveStrengthLines(move)).toEqual([
      "1ヒット目: 5",
      "2〜3ヒット目: ◎",
    ]);
    expect(moveStrengthShortLabel(move)).toBe("5/◎");
  });
});

describe("moveStrengthBadgeLabel: 技一覧行バッジの強度表示", () => {
  test("数値はそのまま表示する", () => {
    expect(moveStrengthBadgeLabel(5)).toBe("5");
  });

  test("記号は ◎ / ● で表示する（記号キーがそのまま出ない）", () => {
    expect(moveStrengthBadgeLabel("erase")).toBe("◎");
    expect(moveStrengthBadgeLabel("inert")).toBe("●");
  });

  test("未設定は空文字（バッジの枠自体は残す）", () => {
    expect(moveStrengthBadgeLabel(undefined)).toBe("");
  });
});
