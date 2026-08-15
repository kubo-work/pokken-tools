import { describe, expect, test } from "bun:test";
import {
  formatHitBreakdownValue,
  formatPhaseChangePoints,
  formatStrengthAllowedValues,
  formatTotalDamage,
  formatTotalDamageNote,
} from "@/lib/moves/moveFormat";
import type { HitBreakdownEntry } from "@/types/move";
import { gardevoirBreakdown, meditationBreakdown } from "./testFixtures";

describe("formatStrengthAllowedValues", () => {
  test("打撃は記号を取らないため範囲だけになる", () => {
    expect(formatStrengthAllowedValues("strike")).toBe("1〜8");
  });

  test("弾は範囲に加えて ◎・● も連結する", () => {
    expect(formatStrengthAllowedValues("projectile")).toBe("1〜9・◎・●");
  });
});

describe("formatHitBreakdownValue", () => {
  test("瞑想3段階アシストパワー: 50+45×3", () => {
    expect(formatHitBreakdownValue(meditationBreakdown, "baseDamage")).toBe(
      "50+45×3",
    );
  });

  test("サーナイト8Y: 60+60×3", () => {
    expect(formatHitBreakdownValue(gardevoirBreakdown, "baseDamage")).toBe(
      "60+60×3",
    );
  });

  test("未設定のグループは - になる", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, baseDamage: 10 },
      { hitCount: 2 },
    ];
    expect(formatHitBreakdownValue(entries, "chipDamage")).toBe("-+-");
  });

  test("PCH値もダメージ系と同じ形式で連結する", () => {
    const entries: HitBreakdownEntry[] = [
      { hitCount: 1, phaseChangePoints: 30 },
      { hitCount: 3, phaseChangePoints: 10 },
    ];
    expect(formatHitBreakdownValue(entries, "phaseChangePoints")).toBe(
      "30+10×3",
    );
  });
});

describe("formatTotalDamage", () => {
  test("値があれば数値をそのまま返す", () => {
    expect(formatTotalDamage(72)).toBe("72");
  });

  test("未計測は NO_VALUE_LABEL", () => {
    expect(formatTotalDamage(undefined)).toBe("-");
  });
});

describe("formatTotalDamageNote", () => {
  test("値があれば「（計72）」形式で併記する", () => {
    expect(formatTotalDamageNote(72)).toBe("（計72）");
  });

  test("未入力なら空文字（セルに何も併記しない）", () => {
    expect(formatTotalDamageNote(undefined)).toBe("");
  });
});

describe("formatPhaseChangePoints", () => {
  test("未計測は NO_VALUE_LABEL", () => {
    expect(formatPhaseChangePoints(undefined)).toBe("-");
  });

  test("単一値（小数）はそのまま表示する", () => {
    expect(formatPhaseChangePoints(3.5)).toBe("3.5");
  });

  test("区切りの配列は + で連結し、ヒット数1は省略する", () => {
    expect(
      formatPhaseChangePoints([
        { perHit: 5, hitCount: 1 },
        { perHit: 3.5, hitCount: 4 },
      ]),
    ).toBe("5+3.5×4");
  });

  test("全区切りがヒット数2以上なら全て×表記になる", () => {
    expect(
      formatPhaseChangePoints([
        { perHit: 5, hitCount: 2 },
        { perHit: 3.5, hitCount: 4 },
      ]),
    ).toBe("5×2+3.5×4");
  });
});
