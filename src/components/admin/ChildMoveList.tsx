import { Button, Card, Group, Stack, Text } from "@mantine/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Move, Phase } from "@/types/move";
import { SortableMoveEditor } from "./SortableMoveEditor";

export interface ChildMoveListProps {
  childMoves: Move[];
  phase: Phase;
  onChildChange: (childId: string, move: Move) => void;
  onChildRemove: (childId: string) => void;
  onAddCharge: () => void;
  onAddDerivative: () => void;
}

export const ChildMoveList = ({
  childMoves,
  phase,
  onChildChange,
  onChildRemove,
  onAddCharge,
  onAddDerivative,
}: ChildMoveListProps) => (
  <Card withBorder padding="sm" bg="var(--surface-2)" ml="md">
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={600}>
          ため・派生（{childMoves.length}件）
        </Text>
        <Group gap="xs">
          <Button variant="light" size="compact-xs" onClick={onAddCharge}>
            ため段階を追加
          </Button>
          <Button variant="light" size="compact-xs" onClick={onAddDerivative}>
            派生を追加
          </Button>
        </Group>
      </Group>
      {childMoves.length === 0 ? (
        <Text size="xs" c="dimmed">
          ため/派生はありません。
        </Text>
      ) : (
        <SortableContext
          items={childMoves.map((child) => child.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack gap="xs">
            {childMoves.map((child, childIndex) => (
              <SortableMoveEditor
                key={child.id}
                move={child}
                index={childIndex}
                phase={phase}
                onChange={(updated) => onChildChange(child.id, updated)}
                onRemove={() => onChildRemove(child.id)}
              />
            ))}
          </Stack>
        </SortableContext>
      )}
    </Stack>
  </Card>
);
