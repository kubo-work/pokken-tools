import { describe, expect, test } from "bun:test";
import {
  asEnumValue,
  asNullableEnumValue,
  asOptionalEnumValue,
  pickEnumValues,
} from "@/lib/optionGuards";

const PHASE_OPTIONS = ["duel", "field"] as const;

describe("asEnumValue", () => {
  test("options に含まれる値はそのまま返す", () => {
    expect(asEnumValue("field", PHASE_OPTIONS, "duel")).toBe("field");
  });

  test("null は fallback を返す", () => {
    expect(asEnumValue(null, PHASE_OPTIONS, "duel")).toBe("duel");
  });

  test("options に無い値は fallback を返す", () => {
    expect(asEnumValue("invalid", PHASE_OPTIONS, "duel")).toBe("duel");
  });
});

describe("asOptionalEnumValue", () => {
  test("options に含まれる値はそのまま返す", () => {
    expect(asOptionalEnumValue("duel", PHASE_OPTIONS)).toBe("duel");
  });

  test("null と不正な値は undefined を返す", () => {
    expect(asOptionalEnumValue(null, PHASE_OPTIONS)).toBeUndefined();
    expect(asOptionalEnumValue("invalid", PHASE_OPTIONS)).toBeUndefined();
  });
});

describe("asNullableEnumValue", () => {
  test("options に含まれる値はそのまま返す", () => {
    expect(asNullableEnumValue("duel", PHASE_OPTIONS)).toBe("duel");
  });

  test("null と不正な値は null を返す", () => {
    expect(asNullableEnumValue(null, PHASE_OPTIONS)).toBeNull();
    expect(asNullableEnumValue("invalid", PHASE_OPTIONS)).toBeNull();
  });
});

describe("pickEnumValues", () => {
  test("options に含まれる値だけを options の並び順で返す", () => {
    expect(pickEnumValues(["field", "duel"], PHASE_OPTIONS)).toEqual([
      "duel",
      "field",
    ]);
  });

  test("options に無い値は捨てる", () => {
    expect(pickEnumValues(["invalid", "field"], PHASE_OPTIONS)).toEqual([
      "field",
    ]);
  });

  test("空配列なら空配列を返す", () => {
    expect(pickEnumValues([], PHASE_OPTIONS)).toEqual([]);
  });
});
