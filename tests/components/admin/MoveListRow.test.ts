import { describe, expect, test } from "bun:test";
import { moveStrengthBadgeLabel } from "@/components/admin/MoveListRow";

describe("moveStrengthBadgeLabel: 技一覧行バッジの強度表示", () => {
  test("数値はそのまま表示する", () => {
    expect(moveStrengthBadgeLabel(5)).toBe("5");
  });

  test("記号は ◎ / ● で表示する（記号キーがそのまま出ない）", () => {
    expect(moveStrengthBadgeLabel("erase")).toBe("◎");
    expect(moveStrengthBadgeLabel("inert")).toBe("●");
  });

  test("未設定は空文字（バッジの枠自体は残す）", () => {
    expect(moveStrengthBadgeLabel(undefined)).toBe("");
  });
});
