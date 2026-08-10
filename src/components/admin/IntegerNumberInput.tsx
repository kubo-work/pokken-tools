import {
  BaseNumberInput,
  type BaseNumberInputProps,
} from "./BaseNumberInput";

export type IntegerNumberInputProps = Omit<BaseNumberInputProps, "allowDecimal">;

/**
 * 整数の数値入力フィールド（小数なし）。フレーム・強度・ため段階などに使う。
 * 実装は BaseNumberInput 参照。小数を許可する DecimalNumberInput とはここだけが異なる。
 * key 再マウントの契約（別の対象を選び直したら呼び出し側で key を変える）は
 * BaseNumberInput のドキュメントを参照。
 */
export const IntegerNumberInput = (props: IntegerNumberInputProps) => (
  <BaseNumberInput {...props} allowDecimal={false} />
);
