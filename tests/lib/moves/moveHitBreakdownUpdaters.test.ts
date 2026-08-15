import { describe, expect, test } from "bun:test";
import type { HitBreakdownEntry } from "@/types/move";
import {
  addHitBreakdownEntry,
  removeHitBreakdownEntry,
  setHitBreakdownEntryAttackType,
  setHitBreakdownEntryField,
  setMoveHitBreakdown,
  toggleHitBreakdown,
} from "@/lib/moves/moveHitBreakdownUpdaters";
import { makeMove } from "./testFixtures";

describe("toggleHitBreakdown", () => {
  test("ON かつ未設定なら既定の1グループで初期化する", () => {
    expect(toggleHitBreakdown(undefined, true)).toEqual([{ hitCount: 1 }]);
  });

  test("ON かつ既存内容があれば維持する", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, baseDamage: 50 },
      { hitCount: 3, baseDamage: 45 },
    ];
    expect(toggleHitBreakdown(entries, true)).toBe(entries);
  });

  test("OFF なら undefined になる", () => {
    const entries: HitBreakdownEntry[] = [{ hitCount: 1 }, { hitCount: 1 }];
    expect(toggleHitBreakdown(entries, false)).toBeUndefined();
  });
});

describe("setHitBreakdownEntryField", () => {
  const entries: HitBreakdownEntry[] = [
    { hitCount: 1, baseDamage: 60, guardLevel: "high" },
    { hitCount: 3, baseDamage: 60, airGroundJudgment: "air" },
  ];

  test("指定インデックスのフィールドだけ更新する", () => {
    const next = setHitBreakdownEntryField(entries, 0, "baseDamage", 70);
    expect(next[0]).toEqual({ hitCount: 1, baseDamage: 70, guardLevel: "high" });
    expect(next[1]).toBe(entries[1]);
  });

  test("undefined を渡すとフィールドごと削除される", () => {
    const next = setHitBreakdownEntryField(entries, 0, "guardLevel", undefined);
    expect(next[0]).toEqual({ hitCount: 1, baseDamage: 60 });
    expect("guardLevel" in next[0]).toBe(false);
  });

  test("元の配列・要素を破壊しない（イミュータブル）", () => {
    const original = JSON.parse(JSON.stringify(entries));
    setHitBreakdownEntryField(entries, 1, "baseDamage", 99);
    expect(entries).toEqual(original);
  });
});

describe("addHitBreakdownEntry", () => {
  test("末尾に hitCount:1 のグループを追加する", () => {
    const entries: HitBreakdownEntry[] = [{ hitCount: 1 }, { hitCount: 3 }];
    const next = addHitBreakdownEntry(entries);
    expect(next).toEqual([{ hitCount: 1 }, { hitCount: 3 }, { hitCount: 1 }]);
    expect(entries).toEqual([{ hitCount: 1 }, { hitCount: 3 }]);
  });
});

describe("setMoveHitBreakdown", () => {
  test("内訳が定義した数値項目の単一値は削除される（PCH値も対象）", () => {
    const move = makeMove({
      id: "test_move",
      baseDamage: 100,
      phaseChangePoints: 40,
      chipDamage: 5,
    });
    const next = setMoveHitBreakdown(move, [
      { hitCount: 1, baseDamage: 60, phaseChangePoints: 30 },
      { hitCount: 3, baseDamage: 50, phaseChangePoints: 10 },
    ]);
    expect("baseDamage" in next).toBe(false);
    expect("phaseChangePoints" in next).toBe(false);
    // 内訳が定義していない項目は単一値のまま残る。
    expect(next.chipDamage).toBe(5);
  });
});

describe("setHitBreakdownEntryAttackType", () => {
  const entries: HitBreakdownEntry[] = [
    { hitCount: 1, attackType: "projectile", strength: "erase" },
    { hitCount: 2, attackType: "projectile", strength: "inert" },
  ];

  test("打撃に変えたグループの記号の強度だけが消える", () => {
    const next = setHitBreakdownEntryAttackType(entries, 0, "strike", "projectile");
    expect(next[0]).toEqual({ hitCount: 1, attackType: "strike" });
    expect(next[1]).toEqual(entries[1]);
  });

  test("新しい属性でも有効な強度は残る", () => {
    const numeric: HitBreakdownEntry[] = [
      { hitCount: 1, attackType: "projectile", strength: 5 },
    ];
    const next = setHitBreakdownEntryAttackType(numeric, 0, "strike", "projectile");
    expect(next[0].strength).toBe(5);
  });

  test("グループの属性を外したら技単位の属性で判定する", () => {
    const next = setHitBreakdownEntryAttackType(entries, 0, undefined, "strike");
    expect(next[0]).toEqual({ hitCount: 1 });
  });
});

describe("removeHitBreakdownEntry", () => {
  test("指定インデックスのグループを削除する", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, baseDamage: 50 },
      { hitCount: 3, baseDamage: 45 },
      { hitCount: 1, baseDamage: 30 },
    ];
    const next = removeHitBreakdownEntry(entries, 1);
    expect(next).toEqual([
      { hitCount: 1, baseDamage: 50 },
      { hitCount: 1, baseDamage: 30 },
    ]);
    expect(entries.length).toBe(3);
  });
});
