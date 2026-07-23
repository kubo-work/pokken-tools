import { describe, expect, test } from "bun:test";
import {
  findGroupIndexById,
  flattenGroups,
  groupMovesByParent,
  isChildMove,
  isParentMove,
  reorderChildrenInGroup,
  reorderParentGroups,
} from "@/lib/moves/grouping";
import { makeMove } from "@/lib/moves/testFixtures";
import type { Move } from "@/types/move";

const parentA = makeMove({ id: "parent_a" });
const childA1 = makeMove({
  id: "child_a1",
  variant: "charge",
  parentMoveId: "parent_a",
});
const childA2 = makeMove({
  id: "child_a2",
  variant: "derivative",
  parentMoveId: "parent_a",
});
const parentB = makeMove({ id: "parent_b" });
const childB1 = makeMove({
  id: "child_b1",
  variant: "derivative",
  parentMoveId: "parent_b",
});

/** 規約通り「親直後にその子」が並ぶ moves 配列。 */
const orderedMoves = [parentA, childA1, childA2, parentB, childB1];

const idsOf = (moves: Move[]): string[] => moves.map((move) => move.id);

describe("isParentMove / isChildMove", () => {
  test("variant 未設定と normal は親、charge / derivative は子", () => {
    expect(isParentMove(makeMove({ id: "no_variant" }))).toBe(true);
    expect(isParentMove(makeMove({ id: "normal", variant: "normal" }))).toBe(
      true,
    );
    expect(isParentMove(childA1)).toBe(false);
    expect(isChildMove(childA1)).toBe(true);
    expect(isChildMove(childA2)).toBe(true);
    expect(isChildMove(parentA)).toBe(false);
  });
});

describe("groupMovesByParent", () => {
  test("親直後の子を直前の親の children に積む", () => {
    const groups = groupMovesByParent(orderedMoves);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.parent.id).toBe("parent_a");
    expect(idsOf(groups[0]!.children)).toEqual(["child_a1", "child_a2"]);
    expect(groups[1]!.parent.id).toBe("parent_b");
    expect(idsOf(groups[1]!.children)).toEqual(["child_b1"]);
  });

  test("先頭に親の無い子が来たら独立グループとして扱う（壊れたデータの保険）", () => {
    const groups = groupMovesByParent([childA1, parentA]);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.parent.id).toBe("child_a1");
    expect(groups[0]!.children).toEqual([]);
  });

  test("直前の親と parentMoveId が一致しない子は独立グループとして扱う", () => {
    // childB1 の親は parent_b だが、直前のグループは parent_a
    const groups = groupMovesByParent([parentA, childB1]);
    expect(groups).toHaveLength(2);
    expect(groups[1]!.parent.id).toBe("child_b1");
  });
});

describe("flattenGroups", () => {
  test("groupMovesByParent との往復で元の並びに戻る", () => {
    expect(flattenGroups(groupMovesByParent(orderedMoves))).toEqual(
      orderedMoves,
    );
  });
});

describe("reorderParentGroups", () => {
  test("親グループの移動で子もまとめて動く", () => {
    const reordered = reorderParentGroups(orderedMoves, 0, 1);
    expect(idsOf(reordered)).toEqual([
      "parent_b",
      "child_b1",
      "parent_a",
      "child_a1",
      "child_a2",
    ]);
  });

  test("同じ index への移動は元の配列をそのまま返す", () => {
    expect(reorderParentGroups(orderedMoves, 1, 1)).toBe(orderedMoves);
  });

  test("範囲外の移動元 index では並びが変わらない", () => {
    expect(idsOf(reorderParentGroups(orderedMoves, 5, 0))).toEqual(
      idsOf(orderedMoves),
    );
  });

  test("範囲外の移動先 index は末尾に丸められる", () => {
    const reordered = reorderParentGroups(orderedMoves, 0, 99);
    expect(idsOf(reordered)).toEqual([
      "parent_b",
      "child_b1",
      "parent_a",
      "child_a1",
      "child_a2",
    ]);
  });
});

describe("reorderChildrenInGroup", () => {
  test("指定した親グループ内の子だけを並び替える", () => {
    const reordered = reorderChildrenInGroup(orderedMoves, "parent_a", 0, 1);
    expect(idsOf(reordered)).toEqual([
      "parent_a",
      "child_a2",
      "child_a1",
      "parent_b",
      "child_b1",
    ]);
  });

  test("存在しない親 id では元の配列をそのまま返す", () => {
    expect(reorderChildrenInGroup(orderedMoves, "missing", 0, 1)).toBe(
      orderedMoves,
    );
  });

  test("同じ index への移動は元の配列をそのまま返す", () => {
    expect(reorderChildrenInGroup(orderedMoves, "parent_a", 1, 1)).toBe(
      orderedMoves,
    );
  });
});

describe("findGroupIndexById", () => {
  test("親 id からグループ index を返し、見つからなければ -1", () => {
    const groups = groupMovesByParent(orderedMoves);
    expect(findGroupIndexById(groups, "parent_b")).toBe(1);
    expect(findGroupIndexById(groups, "missing")).toBe(-1);
  });
});
