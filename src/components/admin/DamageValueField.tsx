"use client";

import type { DamageValue } from "@/types/move";
import { IntegerNumberInput } from "./IntegerNumberInput";

export interface DamageValueFieldProps {
  /** IntegerNumberInput 再マウント用キーの前置き（例: `${move.id}-baseDamage`）。 */
  inputKeyPrefix: string;
  label: string;
  value: DamageValue | undefined;
  onChange: (value: DamageValue | undefined) => void;
}

/**
 * ダメージ系の入力欄。「値」と「ヒット数」の 2 入力で表す。
 * - 値が空欄 → 未計測 (undefined)
 * - ヒット数が空欄 → 単発技（数値のみ）
 * - 両方入力 → 多段技（値×ヒット数）
 */
export const DamageValueField = ({
  inputKeyPrefix,
  label,
  value,
  onChange,
}: DamageValueFieldProps) => {
  const perHit = typeof value === "object" ? value.perHit : value;
  const hitCount = typeof value === "object" ? value.hitCount : undefined;

  const emitChange = (
    nextPerHit: number | undefined,
    nextHitCount: number | undefined,
  ) => {
    if (nextPerHit === undefined) {
      onChange(undefined);
      return;
    }
    onChange(
      nextHitCount === undefined
        ? nextPerHit
        : { perHit: nextPerHit, hitCount: nextHitCount },
    );
  };

  return (
    <>
      <IntegerNumberInput
        key={`${inputKeyPrefix}-perHit`}
        label={label}
        description="未計測なら空欄"
        min={0}
        value={perHit}
        onChange={(nextValue) => emitChange(nextValue, hitCount)}
      />
      <IntegerNumberInput
        key={`${inputKeyPrefix}-hitCount`}
        label={`${label}のヒット数`}
        description="多段技のみ（例: 20×3 の 3）。単発は空欄"
        min={2}
        value={hitCount}
        onChange={(nextValue) => emitChange(perHit, nextValue)}
      />
    </>
  );
};
