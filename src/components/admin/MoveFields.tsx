"use client";

import { Checkbox, Group, Select, SimpleGrid, TextInput } from "@mantine/core";
import {
  GUARD_LEVELS,
  MOVE_ATTACK_TYPES,
  MOVE_CATEGORIES,
  MOVE_SPECIAL_ATTRIBUTES,
  SPECIAL_ATTRIBUTE_META,
  strengthRangeForAttackType,
} from "@/lib/meta";
import {
  asNullableEnumValue,
  asOptionalEnumValue,
  pickEnumValues,
} from "@/lib/optionGuards";
import type { Move } from "@/types/move";
import { IntegerNumberInput } from "./IntegerNumberInput";
import {
  ATTACK_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  GUARD_LEVEL_OPTIONS,
} from "./moveFieldsHelpers";
import { ResonanceFlinchField } from "./ResonanceFlinchField";
import {
  setMoveAttackType,
  setMoveCategory,
  setMoveField,
  setMoveStrength,
} from "./moveUpdaters";

export interface MoveFieldsProps {
  move: Move;
  isChild: boolean;
  onChange: (move: Move) => void;
}

export const MoveFields = ({ move, isChild, onChange }: MoveFieldsProps) => {
  const strengthRange = strengthRangeForAttackType(move.attackType);
  // 属性なしの技は攻撃属性・強度・判定・共鳴怯ませを持たないため、これらの入力欄を隠す。
  const hasCategory = move.category !== undefined;
  // つかみは攻撃属性・強度・判定を持たないため、これらの入力欄は隠す。
  const isGrab = move.category === "grab";
  // 攻撃しない技（攻撃属性なし）は強度・判定・共鳴怯ませを持たないため、これらの入力欄は隠す。
  const hasAttackType = move.attackType !== undefined;
  return (
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
          <IntegerNumberInput
            key={`${move.id}-chargeLevel`}
            label="ため段階"
            min={1}
            value={move.chargeLevel ?? 1}
            onChange={(value) =>
              onChange(setMoveField(move, "chargeLevel", value ?? 1))
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
          label="属性"
          placeholder="なし"
          clearable
          data={CATEGORY_OPTIONS}
          value={move.category ?? null}
          onChange={(value) =>
            onChange(
              setMoveCategory(move, asOptionalEnumValue(value, MOVE_CATEGORIES)),
            )
          }
        />
        {hasCategory && !isGrab && (
          <Select
            label="攻撃属性"
            placeholder="なし（攻撃しない技）"
            clearable
            data={ATTACK_TYPE_OPTIONS}
            value={move.attackType ?? null}
            onChange={(value) =>
              onChange(
                setMoveAttackType(
                  move,
                  asOptionalEnumValue(value, MOVE_ATTACK_TYPES),
                ),
              )
            }
          />
        )}
      </SimpleGrid>

      {!isGrab && hasAttackType && (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <IntegerNumberInput
            key={`${move.id}-strength`}
            label="強度"
            placeholder={
              strengthRange && `${strengthRange.min}〜${strengthRange.max}`
            }
            min={strengthRange?.min}
            max={strengthRange?.max}
            value={move.strength}
            onChange={(value) => onChange(setMoveStrength(move, value))}
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
      )}

      {!isGrab && hasAttackType && (
        <ResonanceFlinchField move={move} onChange={onChange} />
      )}

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
};
