import { describe, expect, test } from "bun:test";
import { buildBundleFileName } from "@/lib/admin/bundleFileName";

describe("buildBundleFileName", () => {
  test("ローカル時刻の日付・時刻がそのままファイル名に反映される", () => {
    // タイムゾーン付き（Z）だと実行環境のタイムゾーンによって表示される日時が変わり、
    // getMonth() + 1 の抜けや padStart の抜けを壊しても偶然テストが通ってしまう。
    // Z なしのローカル時刻文字列はどのタイムゾーンでも同じローカル時刻として解釈されるため、
    // 期待値を固定できる。
    const name = buildBundleFileName("2026-08-17T03:05:00");
    expect(name).toBe("pokken-characters-20260817-0305.json");
  });

  test("同じ日時からは常に同じファイル名になる", () => {
    const exportedAt = "2026-01-02T12:34:00";
    expect(buildBundleFileName(exportedAt)).toBe(
      buildBundleFileName(exportedAt),
    );
  });

  test("パース不能な exportedAt では現在時刻にフォールバックする", () => {
    const name = buildBundleFileName("not-a-date");
    expect(name).toMatch(/^pokken-characters-\d{8}-\d{4}\.json$/);
  });
});
