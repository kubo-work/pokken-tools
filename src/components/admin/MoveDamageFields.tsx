"use client";

import { SimpleGrid } from "@mantine/core";
import type { Move } from "@/types/move";
import { DamageValueField } from "./DamageValueField";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { PLACEHOLDER_NOT_MEASURED } from "./moveFieldsHelpers";
import {
  setOptionalMoveField,
  type MoveDamageValueFieldKey,
} from "./moveUpdaters";

export interface MoveDamageFieldsProps {
  move: Move;
  onChange: (move: Move) => void;
}

/** ダメージ系（DamageValue 型）フィールドの一覧。共鳴差分パネルでも同じ並びで使う。 */
export const DAMAGE_VALUE_FIELDS: {
  key: MoveDamageValueFieldKey;
  label: string;
}[] = [
  { key: "baseDamage", label: "基礎ダメージ" },
  { key: "chipDamage", label: "削りダメージ" },
  { key: "guardCrushValue", label: "ガード削り値" },
];

/** ダメージ系（基礎/削り/ガード削り/PCH値）の入力欄。全項目任意で、空欄は未計測扱い。 */
export const MoveDamageFields = ({ move, onChange }: MoveDamageFieldsProps) => (
  <SimpleGrid cols={{ base: 2, sm: 4 }}>
    {DAMAGE_VALUE_FIELDS.map(({ key, label }) => (
      <DamageValueField
        key={`${move.id}-${key}`}
        label={label}
        value={move[key]}
        onChange={(value) => onChange(setOptionalMoveField(move, key, value))}
      />
    ))}
    <IntegerNumberInput
      key={`${move.id}-phaseChangePoints`}
      label="PCH値"
      description="フェイズチェンジポイント"
      placeholder={PLACEHOLDER_NOT_MEASURED}
      min={0}
      value={move.phaseChangePoints}
      onChange={(value) =>
        onChange(setOptionalMoveField(move, "phaseChangePoints", value))
      }
    />
  </SimpleGrid>
);
