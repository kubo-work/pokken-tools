import { describe, expect, test } from "bun:test";
import {
  bestGuardFrameAdvantage,
  formatPunishWindow,
  knownWorstGuardFrameAdvantage,
} from "@/lib/frame/frameAdvantage";

describe("knownWorstGuardFrameAdvantage", () => {
  test("単一値はそのまま返す", () => {
    expect(knownWorstGuardFrameAdvantage(-5)).toBe(-5);
  });

  test("範囲なら min（攻撃側が最も不利な当て方）を返す", () => {
    expect(knownWorstGuardFrameAdvantage({ min: -8, max: -4 })).toBe(-8);
  });

  test("min が未計測なら、下限は保証せず既知の max で代用する", () => {
    expect(knownWorstGuardFrameAdvantage({ max: -4 })).toBe(-4);
  });
});

describe("bestGuardFrameAdvantage", () => {
  test("単一値はそのまま返す", () => {
    expect(bestGuardFrameAdvantage(-5)).toBe(-5);
  });

  test("範囲なら max（攻撃側が最も有利な当て方）を返す", () => {
    expect(bestGuardFrameAdvantage({ min: -8, max: -4 })).toBe(-4);
  });

  test("max が未計測なら undefined を返す（有利側は不明）", () => {
    expect(bestGuardFrameAdvantage({ min: -8 })).toBeUndefined();
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

  test("min のみ（max 未計測）なら有利側（余裕が最小になる側）を省略して返す", () => {
    expect(formatPunishWindow({ min: -8 })).toBe("〜8");
  });

  test("max のみ（min 未計測）なら不利側（余裕が最大になる側）を省略して返す", () => {
    expect(formatPunishWindow({ max: -4 })).toBe("4〜");
  });
});
