import { Badge, Group, Stack, Text, UnstyledButton } from "@mantine/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ACCENT_BORDER, SURFACE } from "@/lib/admin/surfaceTokens";
import { strengthLabelOf } from "@/lib/moves/moveCategoricalDisplay";
import { CATEGORY_META } from "@/lib/moves/moveLabels";
import type { MoveGroup } from "@/lib/moves/grouping";
import type { StrengthValue } from "@/types/move";
import { MoveDragHandle } from "./MoveDragHandle";

/**
 * 一覧行バッジに表示する強度ラベル。数値も記号（◎/●）も strengthLabelOf を通すことで、
 * "erase"/"inert" のキーがそのまま文字列化されて出るのを防ぐ。未設定はバッジの見た目を
 * 保つため空文字（strengthLabelOf は undefined を返すが、このバッジは値なしでも枠を出す）。
 */
export const moveStrengthBadgeLabel = (
  strength: StrengthValue | undefined,
): string => strengthLabelOf(strength) ?? "";

export interface MoveListRowProps {
  group: MoveGroup;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

/**
 * 技一覧（マスター側）の 1 行。並び替え用グリップと、技を選択するための要約表示を持つ。
 * グリップ（ドラッグ）と本体クリック（選択）を別要素に分け、操作が競合しないようにする。
 */
export const MoveListRow = ({
  group,
  index,
  selected,
  onSelect,
}: MoveListRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.parent.id });

  const { parent, children } = group;

  return (
    <Group
      ref={setNodeRef}
      wrap="nowrap"
      gap="xs"
      align="center"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        padding: "6px 8px",
        borderRadius: 8,
        border: `1px solid ${SURFACE.border}`,
        borderLeft: selected ? ACCENT_BORDER : `1px solid ${SURFACE.border}`,
        background: selected ? SURFACE.card : "transparent",
      }}
    >
      <MoveDragHandle
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
        isDragging={isDragging}
      />
      <UnstyledButton
        onClick={onSelect}
        style={{ flex: 1, minWidth: 0, textAlign: "left" }}
      >
        <Group gap={8} wrap="nowrap" align="center">
          <Text size="sm" c="dimmed" fw={700} style={{ width: 22 }}>
            #{index + 1}
          </Text>
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={600} truncate>
              {parent.name !== "" ? parent.name : "（未入力）"}
            </Text>
            <Group gap={6} wrap="nowrap">
              {parent.command !== "" && (
                <Text size="xs" c="dimmed" truncate>
                  {parent.command}
                </Text>
              )}
              <Badge size="xs" variant="light" color="gray">
                {parent.category !== undefined
                  ? CATEGORY_META[parent.category].shortLabel
                  : ""}
                {moveStrengthBadgeLabel(parent.strength)}
              </Badge>
              {children.length > 0 && (
                <Badge size="xs" variant="light" color="grape">
                  +{children.length}
                </Badge>
              )}
            </Group>
          </Stack>
        </Group>
      </UnstyledButton>
    </Group>
  );
};
