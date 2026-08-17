import { describe, expect, test } from "bun:test";
import { buildBundleFileName } from "@/lib/admin/bundleFileName";

describe("buildBundleFileName", () => {
  test("ISO8601 から pokken-characters-YYYYMMDD-HHmm.json を作る", () => {
    const name = buildBundleFileName("2026-08-17T03:05:00.000Z");
    expect(name).toMatch(/^pokken-characters-\d{8}-\d{4}\.json$/);
  });

  test("同じ日時からは常に同じファイル名になる", () => {
    const exportedAt = "2026-01-02T12:34:00.000Z";
    expect(buildBundleFileName(exportedAt)).toBe(
      buildBundleFileName(exportedAt),
    );
  });
});
