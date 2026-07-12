import { describe, expect, test } from "bun:test";
import { moveSchema } from "@/lib/schema";
import type { Move } from "@/types/move";

/** moveSchema を満たす最小の有効な技。各テストはこれを部分的に上書きする。 */
const baseMove: Move = {
  id: "test_move",
  name: "テスト技",
  command: "Y",
  category: "attack",
  attackType: "strike",
  guardLevel: "mid",
  startup: 10,
  guardFrameAdvantage: -5,
  strength: 1,
};

const expectValid = (move: Move) => {
  const result = moveSchema.safeParse(move);
  expect(result.success).toBe(true);
};

const expectInvalid = (move: Move) => {
  const result = moveSchema.safeParse(move);
  expect(result.success).toBe(false);
};

describe("moveSchema: 既存形状の回帰", () => {
  test("hitBreakdown が無い従来通りの技はそのまま通る", () => {
    expectValid({
      ...baseMove,
      baseDamage: { perHit: 20, hitCount: 3 },
      chipDamage: 5,
      airGroundJudgment: "air",
    });
  });
});

describe("moveSchema: hitBreakdown の構造検証", () => {
  test("グループが1つだけでも通る", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 3, baseDamage: 45 }],
    });
  });

  test("グループが空配列だと拒否される", () => {
    expectInvalid({
      ...baseMove,
      hitBreakdown: [],
    });
  });

  test("hitCount 以外に何も設定されていないグループは拒否される", () => {
    expectInvalid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 1 }, { hitCount: 3 }],
    });
  });

  test("2グループ以上で各グループに値があれば通る（瞑想3段階アシストパワー相当）", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 50 },
        { hitCount: 3, baseDamage: 45 },
      ],
    });
  });

  test("guardLevel / airGroundJudgment を含むグループも通る（サーナイト8Y相当）", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 60, guardLevel: "high" },
        { hitCount: 3, baseDamage: 60, airGroundJudgment: "air" },
      ],
    });
  });
});

describe("moveSchema: ダメージ系の相互排他", () => {
  test("hitBreakdown が baseDamage を定義していると技単位の baseDamage は併用できない", () => {
    expectInvalid({
      ...baseMove,
      baseDamage: 10,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 50 },
        { hitCount: 3, baseDamage: 45 },
      ],
    });
  });

  test("hitBreakdown が baseDamage を定義していると共鳴の単一値 baseDamage は併用できない", () => {
    expectInvalid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 50 },
        { hitCount: 3, baseDamage: 45 },
      ],
      resonance: { baseDamage: 10 },
    });
  });

  test("resonance.hitBreakdown が baseDamage を定義していると resonance.baseDamage は併用できない", () => {
    expectInvalid({
      ...baseMove,
      resonance: {
        baseDamage: 10,
        hitBreakdown: [
          { hitCount: 1, baseDamage: 55 },
          { hitCount: 3, baseDamage: 50 },
        ],
      },
    });
  });

  test("hitBreakdown が chipDamage を定義していなければ技単位の chipDamage と併用できる", () => {
    expectValid({
      ...baseMove,
      chipDamage: 5,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 50 },
        { hitCount: 3, baseDamage: 45 },
      ],
    });
  });
});

describe("moveSchema: 攻撃属性を持たない技の制約", () => {
  test("攻撃属性を持たない技の hitBreakdown に guardLevel は設定できない", () => {
    expectInvalid({
      id: "test_grab",
      name: "テストつかみ",
      command: "6Y",
      category: "grab",
      guardLevel: null,
      startup: 15,
      guardFrameAdvantage: -3,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 30, guardLevel: "mid" },
        { hitCount: 1, baseDamage: 20 },
      ],
    });
  });

  test("攻撃属性を持たない技でも guardLevel を含まない hitBreakdown は通る（多段つかみのダメージ内訳）", () => {
    expectValid({
      id: "test_grab",
      name: "テストつかみ",
      command: "6Y",
      category: "grab",
      guardLevel: null,
      startup: 15,
      guardFrameAdvantage: -3,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 30 },
        { hitCount: 1, baseDamage: 20 },
      ],
    });
  });
});
