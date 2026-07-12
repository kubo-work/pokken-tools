import { describe, expect, test } from "bun:test";
import type { HitBreakdownEntry } from "@/types/move";
import {
  addHitBreakdownEntry,
  removeHitBreakdownEntry,
  setHitBreakdownEntryField,
  toggleHitBreakdown,
} from "./moveUpdaters";

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
