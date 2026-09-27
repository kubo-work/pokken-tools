import { describe, expect, test } from "bun:test";
import { shouldBlockNavigation } from "@/lib/admin/shouldBlockNavigation";

describe("shouldBlockNavigation", () => {
  test("未保存の変更があり、別の画面へ移動するときは止める", () => {
    expect(
      shouldBlockNavigation({
        hasUnsavedChanges: true,
        currentPathname: "/admin/characters/pikachu_libre",
        nextPathname: "/admin",
      }),
    ).toBe(true);
  });

  test("未保存の変更があり、別キャラの編集画面へ移動するときは止める", () => {
    // ルート側は key の付け替えで編集 state を再マウントするため、別キャラへの遷移でも変更は失われる
    expect(
      shouldBlockNavigation({
        hasUnsavedChanges: true,
        currentPathname: "/admin/characters/pikachu_libre",
        nextPathname: "/admin/characters/shadow_mewtwo",
      }),
    ).toBe(true);
  });

  test("未保存の変更があっても、pathname が同じ遷移（search / hash の変化）は止めない", () => {
    expect(
      shouldBlockNavigation({
        hasUnsavedChanges: true,
        currentPathname: "/admin/characters/pikachu_libre",
        nextPathname: "/admin/characters/pikachu_libre",
      }),
    ).toBe(false);
  });

  test("未保存の変更がなければ、別の画面への移動も止めない", () => {
    expect(
      shouldBlockNavigation({
        hasUnsavedChanges: false,
        currentPathname: "/admin/characters/pikachu_libre",
        nextPathname: "/admin",
      }),
    ).toBe(false);
  });
});
