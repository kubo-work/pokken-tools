import { describe, expect, test } from "bun:test";
import {
  valueForMode,
  type FrameAdvantageFieldValue,
} from "@/components/admin/FrameAdvantageField";

describe("valueForMode: 範囲への切替", () => {
  test("単一値からなら今の値を min・max 両方に複製する", () => {
    const next: FrameAdvantageFieldValue = valueForMode("range", -5);
    expect(next).toEqual({ min: -5, max: -5 });
  });

  test("未計測からなら両側とも空欄で始まる（未計測を ±0 として保存しないため）", () => {
    expect(valueForMode("range", undefined)).toEqual({});
  });

  test("ダウンからでも両側とも空欄で始まる", () => {
    expect(valueForMode("range", "down")).toEqual({});
  });

  test("すでに範囲ならそのまま引き継ぐ（片側空欄も保つ）", () => {
    expect(valueForMode("range", { min: -8 })).toEqual({ min: -8 });
  });
});

describe("valueForMode: 単一値への切替", () => {
  test("範囲からなら min（最も不利側）を引き継ぐ", () => {
    expect(valueForMode("single", { min: -8, max: -4 })).toBe(-8);
  });

  test("min が空欄の範囲からなら既知の max を引き継ぐ", () => {
    expect(valueForMode("single", { max: -4 })).toBe(-4);
  });

  test("両側が空欄の範囲からなら 0 になる", () => {
    expect(valueForMode("single", {})).toBe(0);
  });

  test("未計測からなら 0 になる", () => {
    expect(valueForMode("single", undefined)).toBe(0);
  });
});

describe("valueForMode: ダウンへの切替", () => {
  test("どの値からでも down になる", () => {
    expect(valueForMode("down", -5)).toBe("down");
    expect(valueForMode("down", { min: -8, max: -4 })).toBe("down");
    expect(valueForMode("down", undefined)).toBe("down");
  });
});
