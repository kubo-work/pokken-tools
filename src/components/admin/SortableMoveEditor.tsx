"use client";

import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ACCENT_BORDER, SURFACE } from "@/lib/admin/surfaceTokens";
import type { Move } from "@/types/move";
import { MoveDragHandle } from "./MoveDragHandle";
import { MoveEditor } from "./MoveEditor";

export interface SortableMoveEditorProps {
  move: Move;
  index: number;
  onChange: (move: Move) => void;
  onRemove: () => void;
}

/**
 * ため・派生（子技）用の並び替え可能な MoveEditor ラッパー。
 * dnd-kit の sortable 状態だけをここに閉じ込め、見た目は MoveEditor に委譲する。
 */
export const SortableMoveEditor = ({
  move,
  index,
  onChange,
  onRemove,
}: SortableMoveEditorProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: move.id });

  const rootStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    // 親にぶら下がる子だと一目で分かるよう左に amber のアクセント帯を出す
    borderLeft: ACCENT_BORDER,
  };

  return (
    <MoveEditor
      move={move}
      index={index}
      isChild
      onChange={onChange}
      onRemove={onRemove}
      dragHandle={
        <MoveDragHandle
          setActivatorNodeRef={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
          isDragging={isDragging}
        />
      }
      rootRef={setNodeRef}
      rootStyle={rootStyle}
      rootBg={SURFACE.card}
    />
  );
};
