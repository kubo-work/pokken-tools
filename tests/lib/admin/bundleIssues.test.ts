import { describe, expect, test } from "bun:test";
import { resolveBundleIssuePaths } from "@/lib/admin/bundleIssues";

describe("resolveBundleIssuePaths", () => {
  test("characters.<index>.* の index をキャラ id に置換する", () => {
    const raw = {
      characters: [{ id: "pikachu" }, { id: "lucario" }],
    };
    const issues = [
      { path: ["characters", 1, "duelMoves", 0, "startup"], message: "不正です" },
    ];
    const resolved = resolveBundleIssuePaths(issues, raw);
    expect(resolved).toEqual([
      { path: ["lucario", "duelMoves", 0, "startup"], message: "不正です" },
    ]);
  });

  test("id が取れない場合は characters[index] にフォールバックする", () => {
    const raw = { characters: [{}] };
    const issues = [{ path: ["characters", 0, "id"], message: "不正です" }];
    const resolved = resolveBundleIssuePaths(issues, raw);
    expect(resolved).toEqual([
      { path: ["characters[0]", "id"], message: "不正です" },
    ]);
  });

  test("characters 以外の path はそのまま返す", () => {
    const raw = { characters: [] };
    const issues = [{ path: ["exceptions", 0, "action"], message: "不正です" }];
    const resolved = resolveBundleIssuePaths(issues, raw);
    expect(resolved).toEqual(issues);
  });

  test("raw が想定外の形でも例外を投げない", () => {
    const issues = [{ path: ["characters", 0, "id"], message: "不正です" }];
    const resolved = resolveBundleIssuePaths(issues, "not an object");
    expect(resolved).toEqual([
      { path: ["characters[0]", "id"], message: "不正です" },
    ]);
  });
});
