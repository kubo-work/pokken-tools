"use client";

import { Select, SimpleGrid } from "@mantine/core";
import type { FrameAdvantageRange } from "@/types/move";
import { HIT_FRAME_ADVANTAGE_DOWN_LABEL } from "@/lib/meta";
import { IntegerNumberInput } from "./IntegerNumberInput";

/** 硬直差の入力形式。ガード硬直差は single / range、ヒット硬直差は down も選べる。 */
type FrameAdvantageInputMode = "single" | "range" | "down";

export type FrameAdvantageFieldValue = number | FrameAdvantageRange | "down";

export interface FrameAdvantageFieldProps {
  /** IntegerNumberInput 再マウント用キーの前置き（例: `${move.id}-guardFrameAdvantage`）。 */
  inputKeyPrefix: string;
  label: string;
  description?: string;
  /** true なら形式をクリアして未計測 (undefined) にできる（ヒット硬直差用）。 */
  clearable: boolean;
  /** true なら「ダウン」を選べる（ヒット硬直差用）。 */
  allowDown: boolean;
  /** 必須項目のラベルに * を付ける（ガード硬直差用）。 */
  withAsterisk?: boolean;
  value: FrameAdvantageFieldValue | undefined;
  onChange: (value: FrameAdvantageFieldValue | undefined) => void;
}

const modeOfValue = (
  value: FrameAdvantageFieldValue | undefined,
): FrameAdvantageInputMode | null => {
  if (value === undefined) {
    return null;
  }
  if (value === "down") {
    return "down";
  }
  return typeof value === "number" ? "single" : "range";
};

/** 形式変更時の初期値。単一値⇄範囲の切替では今の値をできるだけ引き継ぐ。 */
const valueForMode = (
  mode: FrameAdvantageInputMode,
  current: FrameAdvantageFieldValue | undefined,
): FrameAdvantageFieldValue => {
  if (mode === "down") {
    return "down";
  }
  if (mode === "single") {
    if (typeof current === "number") {
      return current;
    }
    return typeof current === "object" ? current.min : 0;
  }
  const base = typeof current === "number" ? current : 0;
  return typeof current === "object" ? current : { min: base, max: base };
};

/**
 * ガード/ヒット硬直差の入力欄。入力形式（単一値／範囲／ダウン）を選び、
 * 形式に応じた数値入力を表示する。範囲は min=最も不利側・max=最も有利側。
 */
export const FrameAdvantageField = ({
  inputKeyPrefix,
  label,
  description,
  clearable,
  allowDown,
  withAsterisk,
  value,
  onChange,
}: FrameAdvantageFieldProps) => {
  const mode = modeOfValue(value);
  const modeOptions: { value: FrameAdvantageInputMode; label: string }[] = [
    { value: "single", label: "単一値" },
    { value: "range", label: "範囲（〇〜〇）" },
    ...(allowDown
      ? [{ value: "down" as const, label: HIT_FRAME_ADVANTAGE_DOWN_LABEL }]
      : []),
  ];
  const range = typeof value === "object" ? value : undefined;
  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }}>
      <Select
        label={label}
        description={description}
        placeholder={clearable ? "未計測" : undefined}
        withAsterisk={withAsterisk}
        clearable={clearable}
        data={modeOptions}
        value={mode}
        onChange={(nextMode) => {
          if (nextMode === null) {
            onChange(undefined);
            return;
          }
          const matched = modeOptions.find(
            (option) => option.value === nextMode,
          );
          if (matched !== undefined) {
            onChange(valueForMode(matched.value, value));
          }
        }}
      />
      {mode === "single" && (
        <IntegerNumberInput
          key={`${inputKeyPrefix}-single`}
          label="硬直差"
          description="攻撃側不利は負の値"
          allowNegative
          value={typeof value === "number" ? value : undefined}
          onChange={(nextValue) => onChange(nextValue ?? 0)}
        />
      )}
      {mode === "range" && (
        <>
          <IntegerNumberInput
            key={`${inputKeyPrefix}-range-min`}
            label="最小（最も不利側）"
            allowNegative
            value={range?.min}
            onChange={(nextValue) =>
              onChange({ min: nextValue ?? 0, max: range?.max ?? 0 })
            }
          />
          <IntegerNumberInput
            key={`${inputKeyPrefix}-range-max`}
            label="最大（最も有利側）"
            allowNegative
            value={range?.max}
            onChange={(nextValue) =>
              onChange({ min: range?.min ?? 0, max: nextValue ?? 0 })
            }
          />
        </>
      )}
    </SimpleGrid>
  );
};
