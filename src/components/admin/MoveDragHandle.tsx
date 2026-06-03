"use client";

import { ActionIcon } from "@mantine/core";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { IconGripVertical } from "@tabler/icons-react";

/** グリップの aria-label。MoveEditor 子技・技一覧行で共通利用する。 */
const DRAG_HANDLE_LABEL = "ドラッグして並び替え";

export interface MoveDragHandleProps {
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
}

/**
 * dnd-kit の並び替えグリップ（プレゼンテーション専用）。
 * 子技カードと技一覧行で同一だったグリップ JSX を共通化したもの。
 */
export const MoveDragHandle = ({
  setActivatorNodeRef,
  attributes,
  listeners,
  isDragging,
}: MoveDragHandleProps) => (
  <ActionIcon
    ref={setActivatorNodeRef}
    variant="subtle"
    size="sm"
    aria-label={DRAG_HANDLE_LABEL}
    style={{ cursor: isDragging ? "grabbing" : "grab" }}
    {...attributes}
    {...listeners}
  >
    <IconGripVertical size={16} />
  </ActionIcon>
);
