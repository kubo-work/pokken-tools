import { Select } from "@mantine/core";
import { PROJECTILE_STRENGTH_SYMBOLS } from "@/lib/moves/moveEnums";
import { formatStrengthAllowedValues } from "@/lib/moves/moveFormat";
import { STRENGTH_SYMBOL_META } from "@/lib/moves/moveLabels";
import {
  isStrengthSymbol,
  STRENGTH_RANGE_BY_ATTACK_TYPE,
  strengthSymbolsForAttackType,
} from "@/lib/moves/moveRules";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { MoveAttackType, StrengthValue } from "@/types/move";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { PLACEHOLDER_NO_STRENGTH } from "./moveFieldsHelpers";

/**
 * 強度の入力欄。弾は数値に加えて ◎・● を取れるため Select、打撃は数値入力と、
 * 攻撃属性で UI そのものが変わる。この分岐を 5 か所の呼び出し側に散らさないよう
 * ここに閉じ、呼び出し側は StrengthValue の読み書きだけを意識する。
 */

/** 強度欄のラベル。分岐（disabled／数値入力／Select）のどれでも同じ文言を使う。 */
const STRENGTH_LABEL = "強度";

/** Mantine Select は文字列しか扱えないため、強度を option の値に変換する。 */
export const strengthToOptionValue = (
  value: StrengthValue | undefined,
): string | null => {
  if (value === undefined) {
    return null;
  }
  return isStrengthSymbol(value) ? value : String(value);
};

/** Select が返す文字列を強度に戻す。記号でも整数でもない値は未設定として捨てる。 */
export const optionValueToStrength = (
  value: string | null,
): StrengthValue | undefined => {
  const symbol = asOptionalEnumValue(value, PROJECTILE_STRENGTH_SYMBOLS);
  if (symbol !== undefined) {
    return symbol;
  }
  if (value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
};

export interface StrengthFieldProps {
  /**
   * 入力欄を作り直すための key の一部。攻撃属性が変わると入力可能な値が変わるため、
   * 非制御コンポーネントの再マウント契約（BaseNumberInput 参照）に従って呼び出し側が識別子を渡す。
   */
  fieldKey: string;
  /** 入力可能な値を決める攻撃属性。undefined は強度を持たない技。 */
  attackType: MoveAttackType | undefined;
  value: StrengthValue | undefined;
  onChange: (value: StrengthValue | undefined) => void;
  /** 必須項目のラベルに * を付ける（技本体のみ true）。 */
  withAsterisk?: boolean;
  /** 未入力時の表示。上書き層は「変化なし」、内訳は「なし」を渡す。 */
  placeholder?: string;
}

export const StrengthField = ({
  fieldKey,
  attackType,
  value,
  onChange,
  withAsterisk,
  placeholder,
}: StrengthFieldProps) => {
  if (attackType === undefined) {
    // 攻撃属性を持たない技は強度を持たない（スキーマ側でも設定を禁止している）。
    return (
      <IntegerNumberInput
        key={`${fieldKey}-none`}
        label={STRENGTH_LABEL}
        placeholder={PLACEHOLDER_NO_STRENGTH}
        disabled
        value={undefined}
        onChange={() => undefined}
      />
    );
  }
  // attackType を上で narrow 済みのため、以降は formatStrengthAllowedValues など
  // MoveAttackType（undefined を含まない）を受け取る関数へそのまま渡せる。
  const range = STRENGTH_RANGE_BY_ATTACK_TYPE[attackType];
  const symbols = strengthSymbolsForAttackType(attackType);
  // 未入力時の表示は数値入力・Select のどちらでも同じ。呼び出し側の指定が無ければ
  // 入力できる値の一覧（例「1〜9・◎・●」）を出す。
  const emptyPlaceholder = placeholder ?? formatStrengthAllowedValues(attackType);
  if (symbols.length === 0) {
    return (
      <IntegerNumberInput
        key={`${fieldKey}-${attackType}`}
        label={STRENGTH_LABEL}
        withAsterisk={withAsterisk}
        placeholder={emptyPlaceholder}
        min={range.min}
        max={range.max}
        value={typeof value === "number" ? value : undefined}
        onChange={(next) => onChange(next)}
      />
    );
  }
  const numericOptions = Array.from(
    { length: range.max - range.min + 1 },
    (_, index) => {
      const numericValue = String(range.min + index);
      return { value: numericValue, label: numericValue };
    },
  );
  const symbolOptions = symbols.map((symbol) => ({
    value: symbol,
    label: STRENGTH_SYMBOL_META[symbol].label,
  }));
  return (
    <Select
      key={`${fieldKey}-${attackType}`}
      label={STRENGTH_LABEL}
      withAsterisk={withAsterisk}
      placeholder={placeholder ?? formatStrengthAllowedValues(attackType)}
      clearable
      data={[...numericOptions, ...symbolOptions]}
      value={strengthToOptionValue(value)}
      onChange={(next) => onChange(optionValueToStrength(next))}
    />
  );
};
