"use client";

import { Select, SimpleGrid } from "@mantine/core";
import type {
  FrameAdvantageRange,
  GuardFrameAdvantage,
  HitFrameAdvantage,
} from "@/types/move";
import { HIT_FRAME_ADVANTAGE_DOWN_LABEL } from "@/lib/meta";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { PLACEHOLDER_NOT_MEASURED } from "./moveFieldsHelpers";

/** 硬直差の入力形式。guard は single / range、hit はさらに down を選べる。 */
type FrameAdvantageInputMode = "single" | "range" | "down";

type FrameAdvantageFieldValue = number | FrameAdvantageRange | "down";

const GUARD_MODES: FrameAdvantageInputMode[] = ["single", "range"];
const HIT_MODES: FrameAdvantageInputMode[] = ["single", "range", "down"];

const MODE_LABELS: Record<FrameAdvantageInputMode, string> = {
  single: "単一値",
  range: "範囲（〇〜〇）",
  down: HIT_FRAME_ADVANTAGE_DOWN_LABEL,
};

interface FrameAdvantageFieldBaseProps {
  /** IntegerNumberInput 再マウント用キーの前置き（例: `${move.id}-guardFrameAdvantage`）。 */
  inputKeyPrefix: string;
  label: string;
  description?: string;
  /** 必須項目のラベルに * を付ける（ガード硬直差用）。 */
  withAsterisk?: boolean;
}

/**
 * kind で入力できる値の型を分け、呼び出し側にランタイム防御を持ち込まない。
 * - guard: 必須。単一値／範囲のみ（「ダウン」・未計測なし）
 * - hit:   任意（形式をクリアで未計測）。「ダウン」あり
 */
export type FrameAdvantageFieldProps =
  | (FrameAdvantageFieldBaseProps & {
      kind: "guard";
      value: GuardFrameAdvantage;
      onChange: (value: GuardFrameAdvantage) => void;
    })
  | (FrameAdvantageFieldBaseProps & {
      kind: "hit";
      value: HitFrameAdvantage | undefined;
      onChange: (value: HitFrameAdvantage | undefined) => void;
    });

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
  if (typeof current === "object") {
    return mode === "range" ? current : current.min;
  }
  const base = typeof current === "number" ? current : 0;
  return mode === "range" ? { min: base, max: base } : base;
};

/**
 * ガード/ヒット硬直差の入力欄。入力形式（単一値／範囲／ダウン）を選び、
 * 形式に応じた数値入力を表示する。範囲は min=最も不利側・max=最も有利側。
 */
export const FrameAdvantageField = (props: FrameAdvantageFieldProps) => {
  const { inputKeyPrefix, label, description, withAsterisk } = props;
  const isHit = props.kind === "hit";
  const value: FrameAdvantageFieldValue | undefined = props.value;
  const availableModes = isHit ? HIT_MODES : GUARD_MODES;
  const mode = modeOfValue(value);
  const range = typeof value === "object" ? value : undefined;

  const emitChange = (next: FrameAdvantageFieldValue | undefined) => {
    if (props.kind === "hit") {
      props.onChange(next);
      return;
    }
    // guard の形式 Select には「ダウン」もクリアも無いため、この分岐に
    // undefined / "down" は来ない。型の絞り込みのためだけの条件。
    if (next !== undefined && next !== "down") {
      props.onChange(next);
    }
  };

  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }}>
      <Select
        label={label}
        description={description}
        placeholder={isHit ? PLACEHOLDER_NOT_MEASURED : undefined}
        withAsterisk={withAsterisk}
        clearable={isHit}
        data={availableModes.map((availableMode) => ({
          value: availableMode,
          label: MODE_LABELS[availableMode],
        }))}
        value={mode}
        onChange={(nextMode) => {
          const matchedMode = asOptionalEnumValue(nextMode, availableModes);
          emitChange(
            matchedMode === undefined
              ? undefined
              : valueForMode(matchedMode, value),
          );
        }}
      />
      {mode === "single" && (
        <IntegerNumberInput
          key={`${inputKeyPrefix}-single`}
          label="硬直差"
          description="攻撃側不利は負の値"
          allowNegative
          value={typeof value === "number" ? value : undefined}
          onChange={(nextValue) => emitChange(nextValue ?? 0)}
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
              emitChange({ min: nextValue ?? 0, max: range?.max ?? 0 })
            }
          />
          <IntegerNumberInput
            key={`${inputKeyPrefix}-range-max`}
            label="最大（最も有利側）"
            allowNegative
            value={range?.max}
            onChange={(nextValue) =>
              emitChange({ min: range?.min ?? 0, max: nextValue ?? 0 })
            }
          />
        </>
      )}
    </SimpleGrid>
  );
};
