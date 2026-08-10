import { NumberInput, type NumberInputProps } from "@mantine/core";

export interface BaseNumberInputProps {
  label: string;
  description?: string;
  placeholder?: string;
  /** 必須項目のラベルに * を付ける（表示のみで検証はスキーマ側）。 */
  withAsterisk?: boolean;
  /** 他の入力欄で設定済みなど、この欄からは入力させたくないとき true。 */
  disabled?: boolean;
  /** マウント時の初期値。未入力なら undefined。 */
  value: number | undefined;
  /** 負の値を許可するか。ガード/ヒット硬直差は true。 */
  allowNegative?: boolean;
  /** 小数を許可するか。整数専用は IntegerNumberInput、小数許可は DecimalNumberInput から渡す。 */
  allowDecimal: boolean;
  min?: number;
  max?: number;
  onChange: (value: number | undefined) => void;
  /** Mantine の Styles API 経由でラッパー要素にクラスを当てたい場合に指定（例: subgrid 整列）。 */
  classNames?: NumberInputProps["classNames"];
}

/**
 * 数値入力フィールドの共通実装。IntegerNumberInput（整数専用）と DecimalNumberInput
 * （小数許可）が allowDecimal だけを変えて使う。
 *
 * Mantine NumberInput を「非制御」で使うのが要点。制御（value を毎回親から戻す）にすると、
 * 入力途中の "" や "-" を親が数値へ丸めて押し戻し、手入力やマイナス入力が潰れる。
 * 非制御にすると入力途中の文字列は NumberInput 内部で完結し、確定した数値だけ onChange で受け取れる。
 *
 * 別の対象（技など）を選び直したときは内部状態を作り直す必要があるため、呼び出し側で
 * key（例 `${move.id}-strength`）を付けて再マウントさせること。
 */
export const BaseNumberInput = ({
  label,
  description,
  placeholder,
  withAsterisk,
  disabled,
  value,
  allowNegative = false,
  allowDecimal,
  min,
  max,
  onChange,
  classNames,
}: BaseNumberInputProps) => (
  <NumberInput
    label={label}
    description={description}
    placeholder={placeholder}
    withAsterisk={withAsterisk}
    disabled={disabled}
    allowNegative={allowNegative}
    allowDecimal={allowDecimal}
    min={min}
    max={max}
    defaultValue={value}
    onChange={(next) => onChange(typeof next === "number" ? next : undefined)}
    classNames={classNames}
  />
);
