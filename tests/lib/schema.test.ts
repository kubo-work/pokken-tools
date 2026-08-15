import { describe, expect, test } from "bun:test";
import {
  characterSchema,
  emailSchema,
  exceptionsSchema,
  moveSchema,
} from "@/lib/schema";
import type { Character } from "@/types/character";
import type { Move, StrengthValue } from "@/types/move";

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

  test("phaseChangePoints / resonanceFlinch を含むグループも通る", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, phaseChangePoints: 30, resonanceFlinch: "weak" },
        { hitCount: 3, phaseChangePoints: 10, resonanceFlinch: "strong" },
      ],
    });
  });

  test("phaseChangePoints だけのグループも通る（ヒット数以外に1項目あるため）", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 2, phaseChangePoints: 20 }],
    });
  });

  test("resonanceFlinch に切替形式は設定できない（グループ内は一定のため）", () => {
    // 型では弾けるが KV から読む JSON は型を通らないため、schema で拒否できることを確認する。
    const invalidMove: unknown = {
      ...baseMove,
      hitBreakdown: [{ hitCount: 1, resonanceFlinch: { switchActiveFrame: 5 } }],
    };
    expect(moveSchema.safeParse(invalidMove).success).toBe(false);
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

  test("技単位の内訳と共鳴の単一値は併用できる（後から適用される共鳴が勝つ）", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 50 },
        { hitCount: 3, baseDamage: 45 },
      ],
      resonance: { baseDamage: 10 },
    });
  });

  test("技単位の内訳とフィールドフェイズの単一値は併用できる（FP では内訳を使わない技）", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 50 },
        { hitCount: 3, baseDamage: 45 },
      ],
      fieldPhase: { baseDamage: 45 },
    });
  });

  test("技単位の単一値とフィールドフェイズの内訳も併用できる（FP だけ多段になる技）", () => {
    expectValid({
      ...baseMove,
      baseDamage: 45,
      fieldPhase: {
        hitBreakdown: [
          { hitCount: 1, baseDamage: 50 },
          { hitCount: 3, baseDamage: 45 },
        ],
      },
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

  test("hitBreakdown が phaseChangePoints を定義していると技単位の phaseChangePoints は併用できない", () => {
    expectInvalid({
      ...baseMove,
      phaseChangePoints: 40,
      hitBreakdown: [
        { hitCount: 1, phaseChangePoints: 30 },
        { hitCount: 3, phaseChangePoints: 10 },
      ],
    });
  });

  test("PCH値も同じく、技単位の内訳と共鳴の単一値は併用できる", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, phaseChangePoints: 30 },
        { hitCount: 3, phaseChangePoints: 10 },
      ],
      resonance: { phaseChangePoints: 50 },
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

describe("moveSchema: PCH値の小数点・区切り配列", () => {
  test("phaseChangePoints に小数を設定できる", () => {
    expectValid({ ...baseMove, phaseChangePoints: 3.5 });
  });

  test("上書き層（共鳴）の phaseChangePoints にも小数を設定できる", () => {
    expectValid({ ...baseMove, resonance: { phaseChangePoints: 12.25 } });
  });

  test("ヒット内訳の phaseChangePoints にも小数を設定できる", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 1, phaseChangePoints: 30.5 }],
    });
  });

  test("ヒットごとに違う PCH を区切りの配列で設定できる（1ヒットの区切りも許可）", () => {
    expectValid({
      ...baseMove,
      phaseChangePoints: [
        { perHit: 5, hitCount: 1 },
        { perHit: 3.5, hitCount: 4 },
      ],
    });
  });

  test("区切りの hitCount が 0 だと拒否される", () => {
    expectInvalid({
      ...baseMove,
      phaseChangePoints: [{ perHit: 5, hitCount: 0 }],
    });
  });

  test("区切りの perHit が負の値だと拒否される", () => {
    expectInvalid({
      ...baseMove,
      phaseChangePoints: [{ perHit: -1, hitCount: 1 }],
    });
  });

  test("区切りの配列が空だと拒否される", () => {
    expectInvalid({
      ...baseMove,
      phaseChangePoints: [],
    });
  });

  test("hitBreakdown が phaseChangePoints を定義していると、区切り配列形式でも技単位との併用はできない", () => {
    expectInvalid({
      ...baseMove,
      phaseChangePoints: [{ perHit: 5, hitCount: 1 }],
      hitBreakdown: [
        { hitCount: 1, phaseChangePoints: 30 },
        { hitCount: 3, phaseChangePoints: 10 },
      ],
    });
  });
});

describe("moveSchema: 合計ダメージ", () => {
  test("基礎ダメージが単一値（1ヒット）の技には設定できない", () => {
    expectInvalid({ ...baseMove, baseDamage: 40, totalDamage: 40 });
  });

  test("基礎ダメージ未設定の技には設定できない", () => {
    expectInvalid({ ...baseMove, totalDamage: 40 });
  });

  test("基礎ダメージが多段表記（perHit×hitCount）の技には設定できる", () => {
    expectValid({
      ...baseMove,
      baseDamage: { perHit: 40, hitCount: 2 },
      totalDamage: 72,
    });
  });

  test("ヒット内訳で基礎ダメージが多段の技には設定できる", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 50 },
        { hitCount: 3, baseDamage: 45 },
      ],
      totalDamage: 165,
    });
  });

  test("技本体は単発でも、共鳴時に基礎ダメージが多段になるなら共鳴側の合計ダメージは設定できる", () => {
    expectValid({
      ...baseMove,
      baseDamage: 40,
      resonance: { baseDamage: { perHit: 50, hitCount: 2 }, totalDamage: 95 },
    });
  });

  test("技本体は多段でも、共鳴時に基礎ダメージが単発に変わるなら共鳴側の合計ダメージは設定できない", () => {
    expectInvalid({
      ...baseMove,
      baseDamage: { perHit: 40, hitCount: 2 },
      resonance: { baseDamage: 50, totalDamage: 50 },
    });
  });

  test("フィールドフェイズ側が多段の技にはフィールドフェイズ側の合計ダメージを設定できる", () => {
    expectValid({
      ...baseMove,
      baseDamage: 40,
      fieldPhase: { baseDamage: { perHit: 30, hitCount: 2 }, totalDamage: 55 },
    });
  });

  test("技本体が多段なら、フィールドフェイズで単発に変わっても技本体の合計ダメージは設定できる", () => {
    expectValid({
      ...baseMove,
      baseDamage: { perHit: 30, hitCount: 3 },
      totalDamage: 80,
      fieldPhase: { baseDamage: 45 },
    });
  });

  test("技本体が多段なら、共鳴時に単発に変わっても技本体の合計ダメージは設定できる", () => {
    expectValid({
      ...baseMove,
      baseDamage: { perHit: 30, hitCount: 3 },
      totalDamage: 80,
      resonance: { baseDamage: 45 },
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

  test("攻撃属性を持たない技の hitBreakdown に共鳴怯ませは設定できない", () => {
    expectInvalid({
      id: "test_grab",
      name: "テストつかみ",
      command: "6Y",
      category: "grab",
      guardLevel: null,
      startup: 15,
      guardFrameAdvantage: -3,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 30, resonanceFlinch: "strong" },
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

  test("攻撃属性を持たない技の hitBreakdown に攻撃属性・強度は設定できない", () => {
    expectInvalid({
      id: "test_grab",
      name: "テストつかみ",
      command: "6Y",
      category: "grab",
      guardLevel: null,
      startup: 15,
      guardFrameAdvantage: -3,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 30, attackType: "strike" },
        { hitCount: 1, baseDamage: 20 },
      ],
    });
    expectInvalid({
      id: "test_grab",
      name: "テストつかみ",
      command: "6Y",
      category: "grab",
      guardLevel: null,
      startup: 15,
      guardFrameAdvantage: -3,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 30, strength: 1 },
        { hitCount: 1, baseDamage: 20 },
      ],
    });
  });
});

describe("moveSchema: hitBreakdown の攻撃属性・強度", () => {
  test("1ヒット目打撃・2ヒット目弾のようにヒットごとに攻撃属性が違う技は通る", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, attackType: "strike", strength: 5 },
        { hitCount: 1, attackType: "projectile", strength: 3 },
      ],
    });
  });

  test("hitBreakdown の attackType・strength は技単位の値と併用できる（数値4項目と違い相互排他の対象外）", () => {
    expectValid({
      ...baseMove,
      attackType: "strike",
      strength: 5,
      hitBreakdown: [
        { hitCount: 1, attackType: "strike", strength: 5 },
        { hitCount: 2, attackType: "projectile", strength: 3 },
      ],
    });
  });

  test("ヒット内訳の強度は、そのグループの攻撃属性の範囲で検証される", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 1, attackType: "strike", strength: 8 }],
    });
    expectInvalid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 1, attackType: "strike", strength: 9 }],
    });
  });

  test("ヒット内訳のグループが攻撃属性を省略していれば、技単位の攻撃属性の範囲で強度を検証する", () => {
    expectValid({
      ...baseMove,
      attackType: "strike",
      hitBreakdown: [{ hitCount: 1, strength: 8 }],
    });
    expectInvalid({
      ...baseMove,
      attackType: "strike",
      hitBreakdown: [{ hitCount: 1, strength: 9 }],
    });
  });

  test("ヒット内訳の強度は、そのグループの攻撃属性で記号の可否が決まる", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 1, attackType: "projectile", strength: "erase" }],
    });
    expectInvalid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 1, attackType: "strike", strength: "erase" }],
    });
  });

  test("グループが攻撃属性を省略していれば技単位の攻撃属性で記号の可否が決まる", () => {
    expectValid({
      ...baseMove,
      attackType: "projectile",
      strength: 5,
      hitBreakdown: [{ hitCount: 1, strength: "inert" }],
    });
    expectInvalid({
      ...baseMove,
      attackType: "strike",
      hitBreakdown: [{ hitCount: 1, strength: "inert" }],
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

  test("min のみ（max 未計測）の範囲は通る", () => {
    expectValid({ ...baseMove, guardFrameAdvantage: { min: -8 } });
  });

  test("max のみ（min 未計測）の範囲は通る", () => {
    expectValid({ ...baseMove, guardFrameAdvantage: { max: -4 } });
  });

  test("min も max も無い範囲は拒否される", () => {
    expectInvalid({ ...baseMove, guardFrameAdvantage: {} });
  });

  test("ヒット硬直差は down リテラルも通る", () => {
    expectValid({ ...baseMove, hitFrameAdvantage: "down" });
  });
});

describe("moveSchema: 攻撃属性と強度の相関", () => {
  test("打撃の強度は 1〜8（範囲内は通り、範囲外は拒否される）", () => {
    expectValid({ ...baseMove, attackType: "strike", strength: 8 });
    expectInvalid({ ...baseMove, attackType: "strike", strength: 9 });
  });

  test("弾の強度は 1〜9（範囲内は通り、範囲外は拒否される）", () => {
    expectValid({ ...baseMove, attackType: "projectile", strength: 9 });
    expectInvalid({ ...baseMove, attackType: "projectile", strength: 10 });
  });

  test("攻撃属性があるのに強度が無い技は拒否される", () => {
    expectInvalid({ ...baseMove, strength: undefined });
  });

  test("共鳴中の強度も攻撃属性の範囲で検証される", () => {
    expectValid({ ...baseMove, resonance: { strength: 8 } });
    expectInvalid({ ...baseMove, resonance: { strength: 9 } });
  });

  test("ジャスト入力時・共鳴中のジャスト入力時の強度も攻撃属性の範囲で検証される", () => {
    expectValid({ ...baseMove, justInput: { strength: 8 } });
    expectInvalid({ ...baseMove, justInput: { strength: 9 } });
    expectValid({ ...baseMove, justInput: { resonance: { strength: 8 } } });
    expectInvalid({ ...baseMove, justInput: { resonance: { strength: 9 } } });
  });

  test("属性（category）が無い技に攻撃属性は設定できない", () => {
    expectInvalid({ ...baseMove, category: undefined });
  });

  test("攻撃属性を持たない技に強度・判定・共鳴怯ませ強度は設定できない", () => {
    expectInvalid({ ...baseGrabMove, strength: 1 });
    expectInvalid({ ...baseGrabMove, guardLevel: "mid" });
    expectInvalid({ ...baseGrabMove, resonanceFlinch: "strong" });
  });

  test("弾の強度は ◎・● も取れる", () => {
    expectValid({ ...baseMove, attackType: "projectile", strength: "erase" });
    expectValid({ ...baseMove, attackType: "projectile", strength: "inert" });
  });

  test("打撃の強度に ◎・● は設定できない", () => {
    expectInvalid({ ...baseMove, attackType: "strike", strength: "erase" });
    expectInvalid({ ...baseMove, attackType: "strike", strength: "inert" });
  });

  test("記号でも数値でもない強度は拒否される", () => {
    expectInvalid({
      ...baseMove,
      attackType: "projectile",
      strength: "unknown" as unknown as StrengthValue,
    });
  });

  test("上書き層の強度も ◎・● を取れる（弾の技のみ）", () => {
    const projectileMove: Move = { ...baseMove, attackType: "projectile" };
    expectValid({ ...projectileMove, resonance: { strength: "erase" } });
    expectValid({ ...projectileMove, justInput: { strength: "inert" } });
    expectValid({
      ...projectileMove,
      justInput: { resonance: { strength: "erase" } },
    });
    expectValid({ ...projectileMove, fieldPhase: { strength: "erase" } });
    expectInvalid({ ...baseMove, resonance: { strength: "erase" } });
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

  test("ガード割り込みはため・派生技にのみ設定できる", () => {
    expectValid({
      ...baseMove,
      variant: "derivative",
      parentMoveId: "parent",
      guardInterruptFrames: 4,
    });
    expectValid({
      ...baseMove,
      variant: "charge",
      parentMoveId: "parent",
      guardInterruptFrames: 4,
    });
    expectInvalid({ ...baseMove, guardInterruptFrames: 4 });
  });

  test("ガード割り込みは 0 以上の整数のみ", () => {
    const childMove: Move = {
      ...baseMove,
      variant: "derivative",
      parentMoveId: "parent",
    };
    expectValid({ ...childMove, guardInterruptFrames: 0 });
    expectInvalid({ ...childMove, guardInterruptFrames: -1 });
    expectInvalid({ ...childMove, guardInterruptFrames: 1.5 });
  });
});

describe("moveSchema: 攻撃持続", () => {
  test("発生以降のフレームなら通る", () => {
    expectValid({ ...baseMove, activeUntilFrame: 27 });
  });

  test("発生と同じフレームなら通る", () => {
    expectValid({ ...baseMove, activeUntilFrame: baseMove.startup });
  });

  test("発生より前のフレームは拒否される", () => {
    expectInvalid({ ...baseMove, activeUntilFrame: baseMove.startup - 1 });
  });

  test("共鳴で発生・攻撃持続がそろって変わる技は、共鳴側の値同士で検証される", () => {
    expectValid({
      ...baseMove,
      resonance: { startup: 8, activeUntilFrame: 8 },
    });
    expectInvalid({
      ...baseMove,
      resonance: { startup: 12, activeUntilFrame: 10 },
    });
  });

  test("共鳴で発生だけ遅くなる技は拒否され、どの層の発生と比較したかがメッセージに出る", () => {
    const result = moveSchema.safeParse({
      ...baseMove,
      activeUntilFrame: baseMove.startup,
      resonance: { startup: baseMove.startup + 1 },
    });
    expect(result.success).toBe(false);
    // 報告先は技単位の攻撃持続だが、比較相手は共鳴時の発生。層のラベルが無いと
    // 入力欄に見えている発生とメッセージの発生が食い違って見える。
    const messages = result.success
      ? []
      : result.error.issues.map((issue) => issue.message);
    expect(messages.some((message) => message.includes("共鳴時の発生"))).toBe(
      true,
    );
  });

  test("ジャスト入力時の攻撃持続はジャスト入力時の発生以降で検証される", () => {
    expectValid({
      ...baseMove,
      justInput: { startup: 6, activeUntilFrame: 6 },
    });
    expectInvalid({
      ...baseMove,
      justInput: { startup: 6, activeUntilFrame: 5 },
    });
  });
});

describe("moveSchema: ジャスト入力", () => {
  test("ため・派生技にもジャスト入力差分を設定できる", () => {
    expectValid({
      ...baseMove,
      variant: "derivative",
      parentMoveId: "parent",
      justInput: { startup: 6, baseDamage: 30 },
    });
  });

  test("共鳴中はジャストがさらに変わる差分（justInput.resonance）を設定できる", () => {
    expectValid({
      ...baseMove,
      justInput: { baseDamage: 30, resonance: { baseDamage: 35 } },
    });
  });

  test("受付フレームは開始 <= 終了で入力する", () => {
    expectValid({
      ...baseMove,
      justInput: { acceptFrames: { start: 4, end: 4 } },
    });
    expectInvalid({
      ...baseMove,
      justInput: { acceptFrames: { start: 6, end: 4 } },
    });
  });

  test("ジャスト入力のヒット内訳で設定済みの項目はジャスト入力の単一値と併用できない", () => {
    expectInvalid({
      ...baseMove,
      justInput: {
        baseDamage: 10,
        hitBreakdown: [
          { hitCount: 1, baseDamage: 50 },
          { hitCount: 3, baseDamage: 45 },
        ],
      },
    });
  });

  test("ジャスト入力の内訳と、共鳴中のジャスト入力の単一値は併用できる（後の層が勝つ）", () => {
    expectValid({
      ...baseMove,
      justInput: {
        hitBreakdown: [
          { hitCount: 1, baseDamage: 50 },
          { hitCount: 3, baseDamage: 45 },
        ],
        resonance: { baseDamage: 10 },
      },
    });
  });

  test("共鳴中のジャスト入力のヒット内訳で設定済みの項目は、その単一値と併用できない", () => {
    expectInvalid({
      ...baseMove,
      justInput: {
        resonance: {
          baseDamage: 10,
          hitBreakdown: [
            { hitCount: 1, baseDamage: 55 },
            { hitCount: 3, baseDamage: 50 },
          ],
        },
      },
    });
  });

  test("技単位の内訳と、共鳴中のジャスト入力の単一値は併用できる（後の層が勝つ）", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [
        { hitCount: 1, baseDamage: 50 },
        { hitCount: 3, baseDamage: 45 },
      ],
      justInput: { resonance: { baseDamage: 10 } },
    });
  });

  test("共鳴の内訳と、ジャスト入力の単一値も併用できる（ジャスト入力の方が後の層）", () => {
    expectValid({
      ...baseMove,
      resonance: {
        hitBreakdown: [
          { hitCount: 1, baseDamage: 50 },
          { hitCount: 3, baseDamage: 45 },
        ],
      },
      justInput: { baseDamage: 10 },
    });
  });

  test("内訳が後段の層で差し替わっていれば、上位層の内訳とは衝突しない", () => {
    // ジャスト入力時の実効内訳は justInput.hitBreakdown（chipDamage のみ）に差し替わるため、
    // baseDamage は単一値だけが実効値になり、どちらを採るかの曖昧さが生じない。
    // 通常時は技単位の内訳が実効値で、こちらも単一値と重ならない。
    expectValid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 1, baseDamage: 50 }],
      justInput: {
        baseDamage: 10,
        hitBreakdown: [{ hitCount: 1, chipDamage: 5 }],
      },
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
  commonMoves: [],
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

  test("commonMoves 未指定でも受理され、空配列で補完される", () => {
    const result = characterSchema.safeParse({
      id: "test_character",
      name: "テストキャラ",
      duelMoves: [baseMove],
      fieldMoves: [],
    });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.commonMoves).toEqual([]);
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

  test("共通フェーズでも親技は同フェーズ内に必要", () => {
    expectCharacterInvalid({
      ...baseCharacter,
      commonMoves: [
        { ...baseMove, id: "common_child", variant: "derivative", parentMoveId: "missing" },
      ],
    });
  });

  test("fieldPhase は共通技になら設定できる", () => {
    expectCharacterValid({
      ...baseCharacter,
      duelMoves: [],
      commonMoves: [{ ...baseMove, fieldPhase: { startup: 8 } }],
    });
  });

  test("fieldPhase はデュエル技には設定できない", () => {
    expectCharacterInvalid({
      ...baseCharacter,
      duelMoves: [{ ...baseMove, fieldPhase: { startup: 8 } }],
    });
  });

  test("fieldPhase はフィールド技には設定できない", () => {
    expectCharacterInvalid({
      ...baseCharacter,
      duelMoves: [],
      fieldMoves: [{ ...baseMove, fieldPhase: { startup: 8 } }],
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
