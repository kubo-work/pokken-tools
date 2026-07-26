import { describe, expect, test } from "bun:test";
import {
  bestGuardFrameAdvantage,
  formatPunishWindow,
  worstGuardFrameAdvantage,
} from "@/lib/frame/frameAdvantage";

describe("worstGuardFrameAdvantage", () => {
  test("単一値はそのまま返す", () => {
    expect(worstGuardFrameAdvantage(-5)).toBe(-5);
  });

  test("範囲なら min（攻撃側が最も不利な当て方）を返す", () => {
    expect(worstGuardFrameAdvantage({ min: -8, max: -4 })).toBe(-8);
  });
});

describe("bestGuardFrameAdvantage", () => {
  test("単一値はそのまま返す", () => {
    expect(bestGuardFrameAdvantage(-5)).toBe(-5);
  });

  test("範囲なら max（攻撃側が最も有利な当て方）を返す", () => {
    expect(bestGuardFrameAdvantage({ min: -8, max: -4 })).toBe(-4);
  });
});

describe("formatPunishWindow", () => {
  test("単一値は符号を反転した余裕フレームを返す", () => {
    expect(formatPunishWindow(-6)).toBe("6");
  });

  test("攻撃側有利（正の硬直差）なら余裕は負になる", () => {
    expect(formatPunishWindow(2)).toBe("-2");
  });

  test("硬直差 0 は 0 のまま表示する（-0 にならない）", () => {
    expect(formatPunishWindow(0)).toBe("0");
  });

  test("範囲は「最小〜最大」の順で返す", () => {
    expect(formatPunishWindow({ min: -8, max: -4 })).toBe("4〜8");
  });
});
