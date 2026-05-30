"use client";

import type { CSSProperties } from "react";
import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Collapse,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical } from "@tabler/icons-react";
import {
  ATTACK_TYPE_META,
  CATEGORY_META,
  GUARD_LEVELS,
  GUARD_LEVEL_META,
  MOVE_ATTACK_TYPES,
  MOVE_CATEGORIES,
  MOVE_SPECIAL_ATTRIBUTES,
  MOVE_STRENGTHS,
  SPECIAL_ATTRIBUTE_META,
  STRENGTH_META,
} from "@/lib/meta";
import {
  asEnumValue,
  asOptionalEnumValue,
  pickEnumValues,
} from "@/lib/optionGuards";
import type {
  Move,
  MoveStrength,
  ResonanceOverride,
} from "@/types/move";

type ResonanceNumberField = "startup" | "recovery";

const CATEGORY_OPTIONS = MOVE_CATEGORIES.map((category) => ({
  value: category,
  label: CATEGORY_META[category].label,
}));

const ATTACK_TYPE_OPTIONS = MOVE_ATTACK_TYPES.map((attackType) => ({
  value: attackType,
  label: ATTACK_TYPE_META[attackType].label,
}));

const STRENGTH_OPTIONS = MOVE_STRENGTHS.map((strength) => ({
  value: strength,
  label: STRENGTH_META[strength].label,
}));

const RESONANCE_NUMBER_FIELDS: {
  key: ResonanceNumberField;
  label: string;
  negative: boolean;
}[] = [
  { key: "startup", label: "発生", negative: false },
  { key: "recovery", label: "硬直F", negative: false },
];

const toNumber = (value: number | string): number =>
  typeof value === "number" ? value : 0;

export interface MoveEditorProps {
  move: Move;
  index: number;
  onChange: (move: Move) => void;
  onRemove: () => void;
}

export const MoveEditor = ({
  move,
  index,
  onChange,
  onRemove,
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
  const update = <Key extends keyof Move>(key: Key, value: Move[Key]): void => {
    onChange({ ...move, [key]: value });
  };

  const updateResonanceField = (
    key: ResonanceNumberField,
    value: number | string,
  ): void => {
    const next: ResonanceOverride = { ...move.resonance };
    if (value === "") {
      delete next[key];
    } else {
      next[key] = toNumber(value);
    }
    onChange({ ...move, resonance: next });
  };

  const updateResonanceStrength = (value: string | null): void => {
    const next: ResonanceOverride = { ...move.resonance };
    const strength = asOptionalEnumValue(value, MOVE_STRENGTHS);
    if (strength === undefined) {
      delete next.strength;
    } else {
      next.strength = strength;
    }
    onChange({ ...move, resonance: next });
  };

  const hasResonance = move.resonance !== undefined;

  return (
    <Card ref={setNodeRef} style={sortableStyle} withBorder padding="md">
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

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="技名"
            value={move.name}
            onChange={(event) => update("name", event.currentTarget.value)}
          />
          <TextInput
            label="コマンド"
            value={move.command}
            onChange={(event) => update("command", event.currentTarget.value)}
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="分類"
            data={CATEGORY_OPTIONS}
            value={move.category}
            allowDeselect={false}
            onChange={(value) =>
              update("category", asEnumValue(value, MOVE_CATEGORIES, "attack"))
            }
          />
          <Select
            label="攻撃属性"
            placeholder="つかみは任意"
            clearable
            data={ATTACK_TYPE_OPTIONS}
            value={move.attackType ?? null}
            onChange={(value) =>
              update("attackType", asOptionalEnumValue(value, MOVE_ATTACK_TYPES))
            }
          />
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="強度"
            data={STRENGTH_OPTIONS}
            value={move.strength}
            allowDeselect={false}
            onChange={(value) =>
              update("strength", asEnumValue(value, MOVE_STRENGTHS, "weak"))
            }
          />
          <Checkbox.Group
            label="判定（複数可）"
            value={move.guardLevels}
            onChange={(value) =>
              update("guardLevels", pickEnumValues(value, GUARD_LEVELS))
            }
          >
            <Group gap="md" mt={6}>
              {GUARD_LEVELS.map((level) => (
                <Checkbox
                  key={level}
                  value={level}
                  label={GUARD_LEVEL_META[level].label}
                />
              ))}
            </Group>
          </Checkbox.Group>
        </SimpleGrid>

        <Checkbox.Group
          label="特殊属性（複数可・なくても可）"
          value={move.specialAttributes ?? []}
          onChange={(value) => {
            const filtered = pickEnumValues(value, MOVE_SPECIAL_ATTRIBUTES);
            update(
              "specialAttributes",
              filtered.length === 0 ? undefined : filtered,
            );
          }}
        >
          <Group gap="md" mt={6}>
            {MOVE_SPECIAL_ATTRIBUTES.map((attr) => (
              <Checkbox
                key={attr}
                value={attr}
                label={SPECIAL_ATTRIBUTE_META[attr].label}
              />
            ))}
          </Group>
        </Checkbox.Group>

        <SimpleGrid cols={{ base: 2, sm: 2 }}>
          <NumberInput
            label="発生"
            min={0}
            value={move.startup}
            onChange={(value) => update("startup", toNumber(value))}
          />
          <NumberInput
            label="硬直F"
            min={0}
            value={move.recovery}
            onChange={(value) => update("recovery", toNumber(value))}
          />
        </SimpleGrid>

        <TextInput
          label="備考"
          value={move.note ?? ""}
          onChange={(event) =>
            update(
              "note",
              event.currentTarget.value === ""
                ? undefined
                : event.currentTarget.value,
            )
          }
        />
        <Checkbox
          label="共鳴で性能が変化する"
          checked={hasResonance}
          onChange={(event) =>
            onChange({
              ...move,
              resonance: event.currentTarget.checked ? {} : undefined,
            })
          }
        />

        <Group gap="lg">
          <Checkbox
            label="共鳴時"
            checked={move.resonanceOnly === true}
            onChange={(event) =>
              update(
                "resonanceOnly",
                event.currentTarget.checked ? true : undefined,
              )
            }
          />
        </Group>

        <Collapse expanded={hasResonance}>
          <Card withBorder bg="dark.6" padding="sm">
            <Text size="sm" c="dimmed" mb="xs">
              共鳴時に変化する項目だけ入力（空欄は通常時と同じ）
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {RESONANCE_NUMBER_FIELDS.map(({ key, label, negative }) => (
                <NumberInput
                  key={key}
                  label={label}
                  min={negative ? undefined : 0}
                  value={move.resonance?.[key] ?? ""}
                  onChange={(value) => updateResonanceField(key, value)}
                />
              ))}
              <Select
                label="強度"
                placeholder="変化なし"
                clearable
                data={STRENGTH_OPTIONS}
                value={move.resonance?.strength ?? null}
                onChange={updateResonanceStrength}
              />
            </SimpleGrid>
          </Card>
        </Collapse>
      </Stack>
    </Card>
  );
};
