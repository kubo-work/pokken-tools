import { describe, expect, test } from "bun:test";
import {
  characterSchema,
  emailSchema,
  exceptionsSchema,
  moveSchema,
} from "@/lib/schema";
import type { Character } from "@/types/character";
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

/** 攻撃属性を持たない有効なつかみ技。属性系の制約テストで部分上書きして使う。 */
const baseGrabMove: Move = {
  id: "test_grab",
  name: "テストつかみ",
  command: "6Y",
  category: "grab",
  guardLevel: null,
  startup: 15,
  guardFrameAdvantage: -3,
};

describe("moveSchema: ガード硬直差の範囲", () => {
  test("min <= max の範囲は通る", () => {
    expectValid({ ...baseMove, guardFrameAdvantage: { min: -8, max: -4 } });
  });

  test("min と max が同じ値でも通る", () => {
    expectValid({ ...baseMove, guardFrameAdvantage: { min: -5, max: -5 } });
  });

  test("min > max の範囲は拒否される", () => {
    expectInvalid({ ...baseMove, guardFrameAdvantage: { min: -4, max: -8 } });
  });

  test("ヒット硬直差は down リテラルも通る", () => {
    expectValid({ ...baseMove, hitFrameAdvantage: "down" });
  });
});

describe("moveSchema: 攻撃属性と強度の相関", () => {
  test("打撃の強度は 1〜6（範囲内は通り、範囲外は拒否される）", () => {
    expectValid({ ...baseMove, attackType: "strike", strength: 6 });
    expectInvalid({ ...baseMove, attackType: "strike", strength: 7 });
  });

  test("弾の強度は 1〜8（範囲内は通り、範囲外は拒否される）", () => {
    expectValid({ ...baseMove, attackType: "projectile", strength: 8 });
    expectInvalid({ ...baseMove, attackType: "projectile", strength: 9 });
  });

  test("攻撃属性があるのに強度が無い技は拒否される", () => {
    expectInvalid({ ...baseMove, strength: undefined });
  });

  test("共鳴中の強度も攻撃属性の範囲で検証される", () => {
    expectValid({ ...baseMove, resonance: { strength: 6 } });
    expectInvalid({ ...baseMove, resonance: { strength: 7 } });
  });

  test("属性（category）が無い技に攻撃属性は設定できない", () => {
    expectInvalid({ ...baseMove, category: undefined });
  });

  test("攻撃属性を持たない技に強度・判定・共鳴怯ませ強度は設定できない", () => {
    expectInvalid({ ...baseGrabMove, strength: 1 });
    expectInvalid({ ...baseGrabMove, guardLevel: "mid" });
    expectInvalid({ ...baseGrabMove, resonanceFlinch: "strong" });
  });
});

describe("moveSchema: ため・派生の親子関係", () => {
  test("ため・派生技に親技 ID が無いと拒否される", () => {
    expectInvalid({ ...baseMove, variant: "charge" });
    expectInvalid({ ...baseMove, variant: "derivative" });
  });

  test("親技 ID 付きのため・派生技は通る", () => {
    expectValid({ ...baseMove, variant: "charge", parentMoveId: "parent" });
    expectValid({ ...baseMove, variant: "derivative", parentMoveId: "parent" });
  });

  test("通常技に親技 ID は設定できない", () => {
    expectInvalid({ ...baseMove, parentMoveId: "parent" });
    expectInvalid({ ...baseMove, variant: "normal", parentMoveId: "parent" });
  });

  test("ため段階はため技にのみ設定できる", () => {
    expectValid({
      ...baseMove,
      variant: "charge",
      parentMoveId: "parent",
      chargeLevel: 2,
    });
    expectInvalid({
      ...baseMove,
      variant: "derivative",
      parentMoveId: "parent",
      chargeLevel: 2,
    });
  });
});

describe("moveSchema: 弾消し開始フレーム", () => {
  test("特殊属性「弾消し」を持つ技には設定できる", () => {
    expectValid({
      ...baseMove,
      specialAttributes: ["projectileNullify"],
      projectileNullifyStartFrame: 8,
    });
  });

  test("弾消しを持たない技には設定できない", () => {
    expectInvalid({ ...baseMove, projectileNullifyStartFrame: 8 });
    expectInvalid({
      ...baseMove,
      specialAttributes: ["armor"],
      projectileNullifyStartFrame: 8,
    });
  });
});

/** characterSchema を満たす最小の有効なキャラ。各テストはこれを部分的に上書きする。 */
const baseCharacter: Character = {
  id: "test_character",
  name: "テストキャラ",
  duelMoves: [baseMove],
  fieldMoves: [],
};

const expectCharacterValid = (character: Character) => {
  expect(characterSchema.safeParse(character).success).toBe(true);
};

const expectCharacterInvalid = (character: Character) => {
  expect(characterSchema.safeParse(character).success).toBe(false);
};

describe("characterSchema", () => {
  test("最小構成のキャラは通る", () => {
    expectCharacterValid(baseCharacter);
  });

  test("ID は英小文字・数字・_ のみ", () => {
    expectCharacterValid({ ...baseCharacter, id: "pikachu_libre2" });
    expectCharacterInvalid({ ...baseCharacter, id: "Pikachu" });
    expectCharacterInvalid({ ...baseCharacter, id: "pikachu-libre" });
  });

  test("名前が空だと拒否される", () => {
    expectCharacterInvalid({ ...baseCharacter, name: "" });
  });

  test("子技の親が同じフェーズ内にあれば通る", () => {
    expectCharacterValid({
      ...baseCharacter,
      duelMoves: [
        baseMove,
        { ...baseMove, id: "child", variant: "derivative", parentMoveId: baseMove.id },
      ],
    });
  });

  test("子技の親が同じフェーズ内に見つからないと拒否される", () => {
    expectCharacterInvalid({
      ...baseCharacter,
      duelMoves: [
        { ...baseMove, id: "child", variant: "derivative", parentMoveId: "missing" },
      ],
    });
  });

  test("親が別フェーズにいる子技は拒否される（フェーズ跨ぎ不可）", () => {
    expectCharacterInvalid({
      ...baseCharacter,
      fieldMoves: [baseMove],
      duelMoves: [
        { ...baseMove, id: "child", variant: "derivative", parentMoveId: baseMove.id },
      ],
    });
  });
});

describe("exceptionsSchema", () => {
  test("exclude / hit の例外ペア配列は通る", () => {
    const result = exceptionsSchema.safeParse([
      { attackerMoveId: "attacker", defenderMoveId: "defender", action: "exclude" },
      {
        attackerMoveId: "attacker",
        defenderMoveId: "defender",
        action: "hit",
        guardFrameAdvantageOverride: -12,
        note: "先端当て",
      },
    ]);
    expect(result.success).toBe(true);
  });

  test("action が exclude / hit 以外だと拒否される", () => {
    const result = exceptionsSchema.safeParse([
      { attackerMoveId: "attacker", defenderMoveId: "defender", action: "force" },
    ]);
    expect(result.success).toBe(false);
  });

  test("技 ID が空文字だと拒否される", () => {
    const result = exceptionsSchema.safeParse([
      { attackerMoveId: "", defenderMoveId: "defender", action: "exclude" },
    ]);
    expect(result.success).toBe(false);
  });
});

describe("emailSchema", () => {
  test("メールアドレス形式は通る", () => {
    expect(emailSchema.safeParse("user@example.com").success).toBe(true);
  });

  test("メールアドレス形式でない文字列は拒否される", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});
