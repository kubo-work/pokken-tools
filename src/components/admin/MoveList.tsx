import { Button, Group, Stack, Text } from "@mantine/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { MoveGroup } from "@/lib/moves/grouping";
import { MoveListRow } from "./MoveListRow";

export interface MoveListProps {
  groups: MoveGroup[];
  /** 現在詳細表示している親技の id（ハイライト用）。 */
  selectedParentId: string | undefined;
  onSelect: (parentId: string) => void;
  onAdd: () => void;
}

/**
 * マスターディテールのマスター側。コンパクトな技一覧と追加ボタンを表示する。
 * 並び替え（SortableContext）と選択ハイライトのみを担い、編集フォームは持たない。
 */
export const MoveList = ({
  groups,
  selectedParentId,
  onSelect,
  onAdd,
}: MoveListProps) => (
  <Stack gap="xs">
    <Group justify="space-between">
      <Text size="sm" fw={700}>
        技一覧（{groups.length}）
      </Text>
      <Button variant="light" size="compact-xs" onClick={onAdd}>
        技を追加
      </Button>
    </Group>
    {groups.length === 0 ? (
      <Text c="dimmed" size="sm">
        技がありません。
      </Text>
    ) : (
      <SortableContext
        items={groups.map((group) => group.parent.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack gap={6}>
          {groups.map((group, index) => (
            <MoveListRow
              key={group.parent.id}
              group={group}
              index={index}
              selected={group.parent.id === selectedParentId}
              onSelect={() => onSelect(group.parent.id)}
            />
          ))}
        </Stack>
      </SortableContext>
    )}
  </Stack>
);
