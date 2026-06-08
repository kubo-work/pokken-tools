"use client";

import { NumberInput } from "@mantine/core";

export interface FrameNumberInputProps {
  label: string;
  description?: string;
  /** マウント時の初期値。未入力なら undefined。 */
  value: number | undefined;
  /** 負の値を許可するか。ガード/ヒット硬直差は true。 */
  allowNegative?: boolean;
  min?: number;
  onChange: (value: number | undefined) => void;
}

/**
 * フレーム入力用の数値フィールド。
 *
 * Mantine NumberInput を「非制御」で使うのが要点。制御（value を毎回親から戻す）にすると、
 * 入力途中の "" や "-" を親が数値へ丸めて押し戻し、手入力やマイナス入力が潰れる。
 * 非制御にすると入力途中の文字列は NumberInput 内部で完結し、確定した数値だけ onChange で受け取れる。
 *
 * 別の技を選び直したときは内部状態を作り直す必要があるため、呼び出し側で
 * key（例 `${move.id}-guardFrameAdvantage`）を付けて再マウントさせること。
 */
export const FrameNumberInput = ({
  label,
  description,
  value,
  allowNegative = false,
  min,
  onChange,
}: FrameNumberInputProps) => (
  <NumberInput
    label={label}
    description={description}
    allowNegative={allowNegative}
    allowDecimal={false}
    min={min}
    defaultValue={value}
    onChange={(next) => onChange(typeof next === "number" ? next : undefined)}
  />
);
