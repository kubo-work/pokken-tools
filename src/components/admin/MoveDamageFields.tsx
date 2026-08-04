import { SimpleGrid } from "@mantine/core";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { DamageValueField } from "./DamageValueField";
import { IntegerNumberInput } from "./IntegerNumberInput";
import {
  PLACEHOLDER_NOT_MEASURED,
  PLACEHOLDER_SET_BY_HIT_BREAKDOWN,
} from "./moveFieldsHelpers";
import type { HitBreakdownDamageKey } from "@/lib/moves/moveEnums";
import { setOptionalMoveField } from "@/lib/moves/moveUpdaters";

/** ダメージ系（DamageValue 型）フィールドの一覧。共鳴差分パネルでも同じ並びで使う。 */
export const DAMAGE_VALUE_FIELDS: {
  key: HitBreakdownDamageKey;
  label: string;
}[] = [
  { key: "baseDamage", label: "基礎ダメージ" },
  { key: "chipDamage", label: "削りダメージ" },
  { key: "guardCrushValue", label: "ガード削り値" },
];

/**
 * ダメージ系（基礎/削り/ガード削り/PCH値）の入力欄。全項目任意で、空欄は未計測扱い。
 * ヒット内訳（hitBreakdown）が定義済みの項目は、schema の相互排他ルールに合わせて
 * ここでの入力を無効化する（内訳側の入力欄を使う）。
 */
export const MoveDamageFields = ({ move, onChange }: MoveFieldGroupProps) => (
  <SimpleGrid cols={{ base: 2, sm: 4 }}>
    {DAMAGE_VALUE_FIELDS.map(({ key, label }) => {
      const disabledByBreakdown = hitBreakdownDefines(move.hitBreakdown, key);
      return (
        <DamageValueField
          // disabled 切替時に DamageValueField 内部の非制御 draft state を
          // 破棄するため、key に disabledByBreakdown を含めて強制的に再マウントする。
          key={`${move.id}-${key}-${disabledByBreakdown}`}
          label={label}
          placeholder={
            disabledByBreakdown
              ? PLACEHOLDER_SET_BY_HIT_BREAKDOWN
              : PLACEHOLDER_NOT_MEASURED
          }
          disabled={disabledByBreakdown}
          value={move[key]}
          onChange={(value) => onChange(setOptionalMoveField(move, key, value))}
        />
      );
    })}
    <IntegerNumberInput
      key={`${move.id}-phaseChangePoints`}
      label="PCH値"
      description="フェイズチェンジポイント"
      placeholder={PLACEHOLDER_NOT_MEASURED}
      min={0}
      value={move.phaseChangePoints}
      onChange={(value) =>
        onChange(setOptionalMoveField(move, "phaseChangePoints", value))
      }
    />
  </SimpleGrid>
);
