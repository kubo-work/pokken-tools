"use client";

import { NumberInput } from "@mantine/core";

export interface IntegerNumberInputProps {
  label: string;
  description?: string;
  placeholder?: string;
  /** 必須項目のラベルに * を付ける（表示のみで検証はスキーマ側）。 */
  withAsterisk?: boolean;
  /** マウント時の初期値。未入力なら undefined。 */
  value: number | undefined;
  /** 負の値を許可するか。ガード/ヒット硬直差は true。 */
  allowNegative?: boolean;
  min?: number;
  max?: number;
  onChange: (value: number | undefined) => void;
}

/**
 * 整数の数値入力フィールド（小数なし）。フレーム・強度・ため段階などに使う。
 *
 * Mantine NumberInput を「非制御」で使うのが要点。制御（value を毎回親から戻す）にすると、
 * 入力途中の "" や "-" を親が数値へ丸めて押し戻し、手入力やマイナス入力が潰れる。
 * 非制御にすると入力途中の文字列は NumberInput 内部で完結し、確定した数値だけ onChange で受け取れる。
 *
 * 別の対象（技など）を選び直したときは内部状態を作り直す必要があるため、呼び出し側で
 * key（例 `${move.id}-strength`）を付けて再マウントさせること。
 */
export const IntegerNumberInput = ({
  label,
  description,
  placeholder,
  withAsterisk,
  value,
  allowNegative = false,
  min,
  max,
  onChange,
}: IntegerNumberInputProps) => (
  <NumberInput
    label={label}
    description={description}
    placeholder={placeholder}
    withAsterisk={withAsterisk}
    allowNegative={allowNegative}
    allowDecimal={false}
    min={min}
    max={max}
    defaultValue={value}
    onChange={(next) => onChange(typeof next === "number" ? next : undefined)}
  />
);
