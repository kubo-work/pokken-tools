"use client";

import {
  Checkbox,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  TextInput,
} from "@mantine/core";
import {
  GUARD_LEVELS,
  MOVE_ATTACK_TYPES,
  MOVE_CATEGORIES,
  MOVE_SPECIAL_ATTRIBUTES,
  MOVE_STRENGTHS,
  SPECIAL_ATTRIBUTE_META,
} from "@/lib/meta";
import {
  asEnumValue,
  asNullableEnumValue,
  asOptionalEnumValue,
  pickEnumValues,
} from "@/lib/optionGuards";
import type { Move } from "@/types/move";
import {
  ATTACK_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  GUARD_LEVEL_OPTIONS,
  STRENGTH_OPTIONS,
} from "./moveFieldsHelpers";
import { setMoveField } from "./moveUpdaters";

export interface MoveFieldsProps {
  move: Move;
  isChild: boolean;
  onChange: (move: Move) => void;
}

export const MoveFields = ({ move, isChild, onChange }: MoveFieldsProps) => (
  <>
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <TextInput
        label="技名"
        value={move.name}
        onChange={(event) =>
          onChange(setMoveField(move, "name", event.currentTarget.value))
        }
      />
      {move.variant === "charge" ? (
        <NumberInput
          label="ため段階"
          min={1}
          value={move.chargeLevel ?? 1}
          onChange={(value) =>
            onChange(
              setMoveField(
                move,
                "chargeLevel",
                typeof value === "number" ? value : 1,
              ),
            )
          }
        />
      ) : (
        <TextInput
          label={isChild ? "コマンド（親からの追加入力）" : "コマンド"}
          value={move.command}
          onChange={(event) =>
            onChange(setMoveField(move, "command", event.currentTarget.value))
          }
        />
      )}
    </SimpleGrid>

    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <Select
        label="分類"
        data={CATEGORY_OPTIONS}
        value={move.category}
        allowDeselect={false}
        onChange={(value) =>
          onChange(
            setMoveField(
              move,
              "category",
              asEnumValue(value, MOVE_CATEGORIES, "attack"),
            ),
          )
        }
      />
      <Select
        label="攻撃属性"
        placeholder="つかみは任意"
        clearable
        data={ATTACK_TYPE_OPTIONS}
        value={move.attackType ?? null}
        onChange={(value) =>
          onChange(
            setMoveField(
              move,
              "attackType",
              asOptionalEnumValue(value, MOVE_ATTACK_TYPES),
            ),
          )
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
          onChange(
            setMoveField(
              move,
              "strength",
              asEnumValue(value, MOVE_STRENGTHS, "weak"),
            ),
          )
        }
      />
      <Select
        label="判定"
        placeholder="なし"
        clearable
        data={GUARD_LEVEL_OPTIONS}
        value={move.guardLevel}
        onChange={(value) =>
          onChange(
            setMoveField(
              move,
              "guardLevel",
              asNullableEnumValue(value, GUARD_LEVELS),
            ),
          )
        }
      />
    </SimpleGrid>

    <Checkbox.Group
      label="特殊属性（複数可・なくても可）"
      value={move.specialAttributes ?? []}
      onChange={(value) => {
        const filtered = pickEnumValues(value, MOVE_SPECIAL_ATTRIBUTES);
        onChange(
          setMoveField(
            move,
            "specialAttributes",
            filtered.length === 0 ? undefined : filtered,
          ),
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
  </>
);
