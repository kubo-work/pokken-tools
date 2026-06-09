import type { Move, MoveVariant } from "@/types/move";

/** ため/派生など、親技にぶら下がる子技。variant が "normal" 以外で確定している Move。 */
export type ChildMove = Move & { variant: Exclude<MoveVariant, "normal"> };

/**
 * 配列の from index 要素を to index に移動した新しい配列を返す。
 * dnd-kit の arrayMove と同じ挙動だが、Server Component から呼べるよう
 * クライアントライブラリ依存をなくすため自前実装する。
 */
const moveItem = <T,>(items: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || from >= items.length) {
    return items;
  }
  const clamped = Math.max(0, Math.min(to, items.length - 1));
  const next = items.slice();
  const [removed] = next.splice(from, 1);
  next.splice(clamped, 0, removed!);
  return next;
};

export interface MoveGroup {
  parent: Move;
  children: Move[];
}

/** Move の variant 未設定または "normal" を親として扱うかの判定。 */
export const isParentMove = (move: Move): boolean =>
  move.variant === undefined || move.variant === "normal";

/** ため/派生の子技かどうかを判定する型ガード。true なら variant が "normal" 以外に絞られる。 */
export const isChildMove = (move: Move): move is ChildMove =>
  move.variant !== undefined && move.variant !== "normal";

/**
 * フラットな moves 配列を親 → 子のグループに変換する。
 * 不変条件: 子は直前に出現した親の children に積まれる。
 * 規約により JSON でも「親直後にその子」が並ぶように保つ。
 */
export const groupMovesByParent = (moves: Move[]): MoveGroup[] => {
  const groups: MoveGroup[] = [];
  for (const move of moves) {
    if (isParentMove(move)) {
      groups.push({ parent: move, children: [] });
      continue;
    }
    const lastGroup = groups.at(-1);
    if (lastGroup !== undefined && lastGroup.parent.id === move.parentMoveId) {
      lastGroup.children.push(move);
      continue;
    }
    // 親が見つからない子は安全のため独立 group として扱う（壊れたデータの保険）
    groups.push({ parent: move, children: [] });
  }
  return groups;
};

/** グループ配列を「親 → 子」の順でフラットに直す。 */
export const flattenGroups = (groups: MoveGroup[]): Move[] =>
  groups.flatMap((group) => [group.parent, ...group.children]);

/** 親グループ単位の並び替え。子もまとめて移動する。 */
export const reorderParentGroups = (
  moves: Move[],
  fromGroupIndex: number,
  toGroupIndex: number,
): Move[] => {
  if (fromGroupIndex === toGroupIndex) {
    return moves;
  }
  const groups = groupMovesByParent(moves);
  return flattenGroups(moveItem(groups, fromGroupIndex, toGroupIndex));
};

/** 親グループ内の子並び替え。親跨ぎは行わない。 */
export const reorderChildrenInGroup = (
  moves: Move[],
  parentMoveId: string,
  fromIndex: number,
  toIndex: number,
): Move[] => {
  if (fromIndex === toIndex) {
    return moves;
  }
  const groups = groupMovesByParent(moves);
  const target = groups.find((group) => group.parent.id === parentMoveId);
  if (target === undefined) {
    return moves;
  }
  target.children = moveItem(target.children, fromIndex, toIndex);
  return flattenGroups(groups);
};

/** 親グループの index と子の index を同時に返すユーティリティ。 */
export const findGroupIndexById = (
  groups: MoveGroup[],
  id: string,
): number => groups.findIndex((group) => group.parent.id === id);
