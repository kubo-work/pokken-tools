"use client";

import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { MoveGroup } from "@/lib/moves/grouping";
import type { Phase } from "@/types/move";

export interface UsePhaseMoveDndParams {
  phase: Phase;
  groups: MoveGroup[];
  reorderParents: (phase: Phase, fromIndex: number, toIndex: number) => void;
  reorderChildren: (
    phase: Phase,
    parentMoveId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
}

/**
 * 1 フェイズ分の技並び替え（親グループ / 子）のドラッグ処理をまとめる logic hook。
 * 親一覧と子一覧は同一 DndContext を共有し、active/over の id がどちらに属するかで分岐する。
 *  - 親同士: グループ単位で並び替え（子もまとまって移動）
 *  - 子同士: 同じ親内のときだけ並び替え。親跨ぎや親↔子の混在ドラッグは no-op
 */
export const usePhaseMoveDnd = ({
  phase,
  groups,
  reorderParents,
  reorderChildren,
}: UsePhaseMoveDndParams) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (over === null || active.id === over.id) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);

    const fromParentIndex = groups.findIndex(
      (group) => group.parent.id === activeId,
    );
    const toParentIndex = groups.findIndex(
      (group) => group.parent.id === overId,
    );
    if (fromParentIndex !== -1 && toParentIndex !== -1) {
      reorderParents(phase, fromParentIndex, toParentIndex);
      return;
    }

    const findChild = (id: string) => {
      for (const group of groups) {
        const childIndex = group.children.findIndex(
          (child) => child.id === id,
        );
        if (childIndex !== -1) {
          return { parentId: group.parent.id, childIndex };
        }
      }
      return undefined;
    };
    const activeChild = findChild(activeId);
    const overChild = findChild(overId);
    if (
      activeChild !== undefined &&
      overChild !== undefined &&
      activeChild.parentId === overChild.parentId
    ) {
      reorderChildren(
        phase,
        activeChild.parentId,
        activeChild.childIndex,
        overChild.childIndex,
      );
    }
  };

  return { sensors, handleDragEnd };
};
