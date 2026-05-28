"use client";

import {
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
import {
  CATEGORY_META,
  GUARD_LEVELS,
  GUARD_LEVEL_META,
  MOVE_CATEGORIES,
  MOVE_STRENGTHS,
  STRENGTH_META,
} from "@/lib/meta";
import type {
  GuardLevel,
  Move,
  MoveCategory,
  MoveStrength,
  ResonanceOverride,
} from "@/types/move";

type ResonanceNumberField =
  | "startup"
  | "active"
  | "blockAdvantage"
  | "hitAdvantage"
  | "damage";

const CATEGORY_OPTIONS = MOVE_CATEGORIES.map((category) => ({
  value: category,
  label: CATEGORY_META[category].label,
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
  { key: "active", label: "持続", negative: false },
  { key: "blockAdvantage", label: "ガード硬直差", negative: true },
  { key: "hitAdvantage", label: "ヒット硬直差", negative: true },
  { key: "damage", label: "ダメージ", negative: false },
];

function toNumber(value: number | string): number {
  return typeof value === "number" ? value : 0;
}

export function MoveEditor({
  move,
  index,
  onChange,
  onRemove,
}: {
  move: Move;
  index: number;
  onChange: (move: Move) => void;
  onRemove: () => void;
}) {
  function update<Key extends keyof Move>(key: Key, value: Move[Key]) {
    onChange({ ...move, [key]: value });
  }

  function updateResonanceField(
    key: ResonanceNumberField,
    value: number | string,
  ) {
    const next: ResonanceOverride = { ...move.resonance };
    if (value === "") {
      delete next[key];
    } else {
      next[key] = toNumber(value);
    }
    onChange({ ...move, resonance: next });
  }

  function updateResonanceStrength(value: string | null) {
    const next: ResonanceOverride = { ...move.resonance };
    if (value === null) {
      delete next.strength;
    } else {
      next.strength = value as MoveStrength;
    }
    onChange({ ...move, resonance: next });
  }

  const hasResonance = move.resonance !== undefined;

  return (
    <Card withBorder padding="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700}>#{index + 1}</Text>
          <Button variant="subtle" color="red" size="compact-sm" onClick={onRemove}>
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

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Select
            label="分類"
            data={CATEGORY_OPTIONS}
            value={move.category}
            allowDeselect={false}
            onChange={(value) =>
              update("category", (value ?? "attack") as MoveCategory)
            }
          />
          <Select
            label="強度"
            data={STRENGTH_OPTIONS}
            value={move.strength}
            allowDeselect={false}
            onChange={(value) =>
              update("strength", (value ?? "weak") as MoveStrength)
            }
          />
          <Checkbox.Group
            label="ガード（複数可）"
            value={move.guardLevels}
            onChange={(value) =>
              update(
                "guardLevels",
                GUARD_LEVELS.filter((level) => value.includes(level)) as GuardLevel[],
              )
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

        <SimpleGrid cols={{ base: 2, sm: 5 }}>
          <NumberInput
            label="発生"
            min={0}
            value={move.startup}
            onChange={(value) => update("startup", toNumber(value))}
          />
          <NumberInput
            label="持続"
            min={0}
            value={move.active}
            onChange={(value) => update("active", toNumber(value))}
          />
          <NumberInput
            label="ガード硬直差"
            value={move.blockAdvantage}
            onChange={(value) => update("blockAdvantage", toNumber(value))}
          />
          <NumberInput
            label="ヒット硬直差"
            value={move.hitAdvantage}
            onChange={(value) => update("hitAdvantage", toNumber(value))}
          />
          <NumberInput
            label="ダメージ"
            min={0}
            value={move.damage}
            onChange={(value) => update("damage", toNumber(value))}
          />
        </SimpleGrid>

        <TextInput
          label="備考"
          value={move.note ?? ""}
          onChange={(event) =>
            update(
              "note",
              event.currentTarget.value === "" ? undefined : event.currentTarget.value,
            )
          }
        />

        <Group gap="lg">
          <Checkbox
            label="共鳴専用技（通常状態では使用不可）"
            checked={move.resonanceOnly === true}
            onChange={(event) =>
              update("resonanceOnly", event.currentTarget.checked ? true : undefined)
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
}
