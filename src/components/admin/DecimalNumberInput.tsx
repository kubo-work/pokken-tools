import {
  BaseNumberInput,
  type BaseNumberInputProps,
} from "./BaseNumberInput";

export type DecimalNumberInputProps = Omit<BaseNumberInputProps, "allowDecimal">;

/**
 * 小数を許容する数値入力フィールド。PCH値など整数に丸めたくない項目に使う。
 * 非制御・key 再マウントの契約は IntegerNumberInput と同じ（BaseNumberInput 参照）。
 */
export const DecimalNumberInput = (props: DecimalNumberInputProps) => (
  <BaseNumberInput {...props} allowDecimal={true} />
);
