import { describe, expect, test } from "bun:test";
import {
  optionValueToStrength,
  strengthToOptionValue,
} from "@/components/admin/StrengthField";

describe("strengthToOptionValue: 強度 → Select の値", () => {
  test("数値は文字列にする", () => {
    expect(strengthToOptionValue(9)).toBe("9");
  });

  test("記号は英語キーのまま使う", () => {
    expect(strengthToOptionValue("erase")).toBe("erase");
    expect(strengthToOptionValue("inert")).toBe("inert");
  });

  test("未設定は null（Mantine Select の未選択）", () => {
    expect(strengthToOptionValue(undefined)).toBeNull();
  });
});

describe("optionValueToStrength: Select の値 → 強度", () => {
  test("数字の文字列は数値に戻す", () => {
    expect(optionValueToStrength("9")).toBe(9);
  });

  test("記号のキーはそのまま返す", () => {
    expect(optionValueToStrength("erase")).toBe("erase");
    expect(optionValueToStrength("inert")).toBe("inert");
  });

  test("未選択（null・空文字）は未設定", () => {
    expect(optionValueToStrength(null)).toBeUndefined();
    expect(optionValueToStrength("")).toBeUndefined();
  });

  test("想定外の文字列は未設定として捨てる", () => {
    expect(optionValueToStrength("unknown")).toBeUndefined();
    expect(optionValueToStrength("1.5")).toBeUndefined();
  });
});
