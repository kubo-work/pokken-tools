import type { CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ACCENT_BORDER, SURFACE } from "@/lib/admin/surfaceTokens";
import type { Move, Phase } from "@/types/move";
import { MoveDragHandle } from "./MoveDragHandle";
import { MoveEditor } from "./MoveEditor";

export interface SortableMoveEditorProps {
  move: Move;
  index: number;
  phase: Phase;
  /**
   * id を引数で受け取る。呼び出し側（ChildMoveList の map）で子技ごとにクロージャを
   * 作ると毎回参照が変わり、MoveEditor のメモ化が効かなくなるため、id の結び付けはここで行う。
   */
  onChange: (moveId: string, move: Move) => void;
  onRemove: (moveId: string) => void;
}

/**
 * ため・派生（子技）用の並び替え可能な MoveEditor ラッパー。
 * dnd-kit の sortable 状態だけをここに閉じ込め、見た目は MoveEditor に委譲する。
 */
export const SortableMoveEditor = ({
  move,
  index,
  phase,
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

  const handleChange = (updated: Move): void => onChange(move.id, updated);
  const handleRemove = (): void => onRemove(move.id);

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
      phase={phase}
      onChange={handleChange}
      onRemove={handleRemove}
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
