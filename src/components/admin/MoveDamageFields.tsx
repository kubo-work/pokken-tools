"use client";

import { SimpleGrid } from "@mantine/core";
import type { Move } from "@/types/move";
import { DamageValueField } from "./DamageValueField";
import { IntegerNumberInput } from "./IntegerNumberInput";
import {
  setMoveDamageValue,
  setMovePhaseChangePoints,
  type MoveDamageValueFieldKey,
} from "./moveUpdaters";

export interface MoveDamageFieldsProps {
  move: Move;
  onChange: (move: Move) => void;
}

const DAMAGE_VALUE_FIELDS: { key: MoveDamageValueFieldKey; label: string }[] = [
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
        inputKeyPrefix={`${move.id}-${key}`}
        label={label}
        value={move[key]}
        onChange={(value) => onChange(setMoveDamageValue(move, key, value))}
      />
    ))}
    <IntegerNumberInput
      key={`${move.id}-phaseChangePoints`}
      label="PCH値"
      description="フェイズチェンジポイント"
      placeholder="未計測"
      min={0}
      value={move.phaseChangePoints}
      onChange={(value) => onChange(setMovePhaseChangePoints(move, value))}
    />
  </SimpleGrid>
);
