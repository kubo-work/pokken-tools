"use client";

import type { CSSProperties } from "react";
import { ActionIcon, Badge, Button, Card, Group, Stack, Text } from "@mantine/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical } from "@tabler/icons-react";
import { MOVE_VARIANT_META } from "@/lib/meta";
import type { Move } from "@/types/move";
import { ChildMoveList } from "./ChildMoveList";
import { MoveFields } from "./MoveFields";
import { MoveResonancePanel } from "./MoveResonancePanel";
import { MoveTextFields } from "./MoveTextFields";
import { MoveTimingFields } from "./MoveTimingFields";

export interface MoveEditorProps {
  move: Move;
  index: number;
  onChange: (move: Move) => void;
  onRemove: () => void;
  /** 子（ため・派生）描画用。親 MoveEditor からのみ渡す。 */
  childMoves?: Move[];
  onChildChange?: (childId: string, move: Move) => void;
  onChildRemove?: (childId: string) => void;
  onAddCharge?: () => void;
  onAddDerivative?: () => void;
}

export const MoveEditor = ({
  move,
  index,
  onChange,
  onRemove,
  childMoves,
  onChildChange,
  onChildRemove,
  onAddCharge,
  onAddDerivative,
}: MoveEditorProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: move.id });

  const sortableStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const isChild = move.variant !== undefined && move.variant !== "normal";
  const variantLabel = isChild
    ? MOVE_VARIANT_META[move.variant!].label
    : undefined;
  const hasChildSlot =
    childMoves !== undefined &&
    onChildChange !== undefined &&
    onChildRemove !== undefined &&
    onAddCharge !== undefined &&
    onAddDerivative !== undefined;

  return (
    <Card
      ref={setNodeRef}
      style={sortableStyle}
      withBorder
      padding="md"
      bg={isChild ? "dark.7" : undefined}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <ActionIcon
              ref={setActivatorNodeRef}
              variant="subtle"
              size="sm"
              aria-label="ドラッグして並び替え"
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
              {...attributes}
              {...listeners}
            >
              <IconGripVertical size={16} />
            </ActionIcon>
            <Text fw={700}>#{index + 1}</Text>
            {variantLabel !== undefined && (
              <Badge color="grape" variant="light" size="sm">
                {variantLabel}
              </Badge>
            )}
          </Group>
          <Button
            variant="subtle"
            color="red"
            size="compact-sm"
            onClick={onRemove}
          >
            技を削除
          </Button>
        </Group>

        <MoveFields move={move} isChild={isChild} onChange={onChange} />
        <MoveTimingFields move={move} onChange={onChange} />
        <MoveTextFields move={move} onChange={onChange} />
        <MoveResonancePanel move={move} onChange={onChange} />

        {hasChildSlot && (
          <ChildMoveList
            childMoves={childMoves}
            onChildChange={onChildChange}
            onChildRemove={onChildRemove}
            onAddCharge={onAddCharge}
            onAddDerivative={onAddDerivative}
          />
        )}
      </Stack>
    </Card>
  );
};
