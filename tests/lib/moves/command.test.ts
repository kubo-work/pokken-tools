import { describe, expect, test } from "bun:test";
import { formatMoveCommand } from "@/lib/moves/command";
import type { Move } from "@/types/move";

/** コマンド表示に関わる項目だけを持つテスト用の技。 */
const makeMove = (
  overrides: Partial<Move> & Pick<Move, "id" | "command">,
): Move => ({
  name: overrides.id,
  guardLevel: null,
  startup: 10,
  guardFrameAdvantage: -5,
  ...overrides,
});

describe("formatMoveCommand", () => {
  test("通常技は自身のコマンドをそのまま返す", () => {
    const move = makeMove({ id: "normal", command: "5Y" });
    expect(formatMoveCommand(move, undefined)).toBe("5Y");
  });

  test("派生技は親コマンドに追加入力を「 > 」で連結する", () => {
    const move = makeMove({
      id: "derivative",
      command: "X",
      variant: "derivative",
      parentMoveId: "parent",
    });
    expect(formatMoveCommand(move, "5Y")).toBe("5Y > X");
  });

  test("ため技は親コマンドに「長押し」を付け、自身のコマンドは使わない", () => {
    const move = makeMove({
      id: "charge",
      command: "unused",
      variant: "charge",
      parentMoveId: "parent",
    });
    expect(formatMoveCommand(move, "5X")).toBe("5X長押し");
  });

  test("ため技で親コマンドが無ければ自身のコマンドに「長押し」を付ける", () => {
    const move = makeMove({ id: "charge", command: "5X", variant: "charge" });
    expect(formatMoveCommand(move, undefined)).toBe("5X長押し");
  });
});
