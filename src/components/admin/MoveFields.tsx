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
  SPECIAL_ATTRIBUTE_META,
  strengthRangeForAttackType,
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
} from "./moveFieldsHelpers";
import {
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
  // つかみは攻撃属性・強度・判定を持たないため、これらの入力欄は隠す。
  const isGrab = move.category === "grab";
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
          label="属性"
          data={CATEGORY_OPTIONS}
          value={move.category}
          allowDeselect={false}
          onChange={(value) =>
            onChange(
              setMoveCategory(
                move,
                asEnumValue(value, MOVE_CATEGORIES, "attack"),
              ),
            )
          }
        />
        {!isGrab && (
          <Select
            label="攻撃属性"
            clearable
            data={ATTACK_TYPE_OPTIONS}
            value={move.attackType ?? null}
            onChange={(value) => {
              const nextAttackType = asOptionalEnumValue(
                value,
                MOVE_ATTACK_TYPES,
              );
              const withAttackType = setMoveField(
                move,
                "attackType",
                nextAttackType,
              );
              // 攻撃属性を外した場合は強度の許容範囲が無くなるため強度も削除する。
              onChange(
                nextAttackType === undefined
                  ? setMoveStrength(withAttackType, undefined)
                  : withAttackType,
              );
            }}
          />
        )}
      </SimpleGrid>

      {!isGrab && (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <NumberInput
            label="強度"
            placeholder={
              strengthRange === undefined
                ? "攻撃属性を選択"
                : `${strengthRange.min}〜${strengthRange.max}`
            }
            description={
              strengthRange === undefined
                ? "攻撃属性を選択すると入力できます"
                : undefined
            }
            disabled={strengthRange === undefined}
            min={strengthRange?.min}
            max={strengthRange?.max}
            value={move.strength ?? ""}
            onChange={(value) =>
              onChange(
                setMoveStrength(
                  move,
                  typeof value === "number" ? value : undefined,
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
