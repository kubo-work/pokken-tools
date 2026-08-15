import { describe, expect, test } from "bun:test";
import {
  damageValueHitCount,
  hitBreakdownDefines,
  hitBreakdownTotalHitCount,
  isBaseDamageMultiHit,
  isStrengthAllowedFor,
  isStrengthSymbol,
  strengthSymbolsForAttackType,
} from "@/lib/moves/moveRules";
import type { HitBreakdownEntry } from "@/types/move";
import { gardevoirBreakdown, meditationBreakdown } from "./testFixtures";

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

describe("hitBreakdownTotalHitCount", () => {
  test("瞑想3段階アシストパワーの総ヒット数: 1 + 3 = 4", () => {
    expect(hitBreakdownTotalHitCount(meditationBreakdown)).toBe(4);
  });

  test("値を定義していないグループも hitCount として数える", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, baseDamage: 10 },
      { hitCount: 2 },
    ];
    expect(hitBreakdownTotalHitCount(entries)).toBe(3);
  });
});

describe("damageValueHitCount", () => {
  test("単一値（number）は常に1", () => {
    expect(damageValueHitCount(40)).toBe(1);
  });

  test("多段表記は hitCount", () => {
    expect(damageValueHitCount({ perHit: 40, hitCount: 2 })).toBe(2);
  });

  test("未設定は0", () => {
    expect(damageValueHitCount(undefined)).toBe(0);
  });
});

describe("isBaseDamageMultiHit", () => {
  test("単一値の baseDamage は false", () => {
    expect(isBaseDamageMultiHit(40, undefined)).toBe(false);
  });

  test("多段表記の baseDamage は true", () => {
    expect(isBaseDamageMultiHit({ perHit: 40, hitCount: 2 }, undefined)).toBe(
      true,
    );
  });

  test("baseDamage 未設定・hitBreakdown 無しは false", () => {
    expect(isBaseDamageMultiHit(undefined, undefined)).toBe(false);
  });

  test("hitBreakdown があれば内訳の総ヒット数で判定する", () => {
    expect(isBaseDamageMultiHit(undefined, meditationBreakdown)).toBe(true);
  });

  test("内訳が baseDamage を定義していなくても、総ヒット数が2以上なら多段", () => {
    // 内訳グループは技の連続ヒットを漏れなく分割したものなので、値を定義していない
    // グループも技のヒットとして数える（スキーマ側の合計ダメージ判定と同じ数え方）。
    const entries: HitBreakdownEntry[] = [{ hitCount: 3, guardLevel: "high" }];
    expect(isBaseDamageMultiHit(40, entries)).toBe(true);
  });

  test("内訳の総ヒット数が1なら、単一値が多段表記でも単発扱い", () => {
    const entries: HitBreakdownEntry[] = [{ hitCount: 1, guardLevel: "high" }];
    expect(isBaseDamageMultiHit(40, entries)).toBe(false);
    expect(isBaseDamageMultiHit({ perHit: 40, hitCount: 2 }, entries)).toBe(
      false,
    );
  });
});

describe("isStrengthSymbol", () => {
  test("記号なら true、数値なら false", () => {
    expect(isStrengthSymbol("erase")).toBe(true);
    expect(isStrengthSymbol("inert")).toBe(true);
    expect(isStrengthSymbol(5)).toBe(false);
  });
});

describe("strengthSymbolsForAttackType", () => {
  test("弾は ◎・● を取れる", () => {
    expect(strengthSymbolsForAttackType("projectile")).toEqual([
      "erase",
      "inert",
    ]);
  });

  test("打撃は記号を取れない", () => {
    expect(strengthSymbolsForAttackType("strike")).toEqual([]);
  });

  test("攻撃属性を持たない技は記号を取れない", () => {
    expect(strengthSymbolsForAttackType(undefined)).toEqual([]);
  });
});

describe("isStrengthAllowedFor", () => {
  test("打撃の数値は 1〜8", () => {
    expect(isStrengthAllowedFor(1, "strike")).toBe(true);
    expect(isStrengthAllowedFor(8, "strike")).toBe(true);
    expect(isStrengthAllowedFor(9, "strike")).toBe(false);
    expect(isStrengthAllowedFor(0, "strike")).toBe(false);
  });

  test("弾の数値は 1〜9", () => {
    expect(isStrengthAllowedFor(9, "projectile")).toBe(true);
    expect(isStrengthAllowedFor(10, "projectile")).toBe(false);
  });

  test("小数は許可しない", () => {
    expect(isStrengthAllowedFor(1.5, "projectile")).toBe(false);
  });

  test("◎・● は弾だけが取れる", () => {
    expect(isStrengthAllowedFor("erase", "projectile")).toBe(true);
    expect(isStrengthAllowedFor("inert", "projectile")).toBe(true);
    expect(isStrengthAllowedFor("erase", "strike")).toBe(false);
    expect(isStrengthAllowedFor("inert", "strike")).toBe(false);
  });
});
