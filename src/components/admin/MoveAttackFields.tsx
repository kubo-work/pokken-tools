import { Select, SimpleGrid } from "@mantine/core";
import { GUARD_LEVELS } from "@/lib/moves/moveEnums";
import { strengthRangeForAttackType } from "@/lib/moves/moveRules";
import { asNullableEnumValue } from "@/lib/optionGuards";
import { IntegerNumberInput } from "./IntegerNumberInput";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { GUARD_LEVEL_OPTIONS, isGrabMove } from "./moveFieldsHelpers";
import { ResonanceFlinchField } from "./ResonanceFlinchField";
import { setMoveField, setOptionalMoveField } from "@/lib/moves/moveUpdaters";

/**
 * 攻撃属性を持つ技だけが持つ項目（強度・判定・共鳴怯ませ強度）の入力欄。
 *
 * つかみ技と、攻撃しない技（攻撃属性なし）はこれらを持たないため何も描画しない。
 * 表示条件を呼び出し側に置くと項目を足すたびに条件が分散するので、ここに閉じている。
 */
export const MoveAttackFields = ({ move, onChange }: MoveFieldGroupProps) => {
  const hasAttackType = move.attackType !== undefined;
  if (isGrabMove(move) || !hasAttackType) {
    return null;
  }
  // 入力可能な強度の範囲は攻撃属性（打撃／弾）で決まる。
  const strengthRange = strengthRangeForAttackType(move.attackType);
  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <IntegerNumberInput
          key={`${move.id}-strength`}
          label="強度"
          withAsterisk
          placeholder={
            strengthRange && `${strengthRange.min}〜${strengthRange.max}`
          }
          min={strengthRange?.min}
          max={strengthRange?.max}
          value={move.strength}
          onChange={(value) =>
            onChange(setOptionalMoveField(move, "strength", value))
          }
        />
        <Select
          label="判定"
          placeholder="なし"
          clearable
          data={GUARD_LEVEL_OPTIONS}
          value={move.guardLevel}
          onChange={(value) =>
            onChange(
              setMoveField(
                move,
                "guardLevel",
                asNullableEnumValue(value, GUARD_LEVELS),
              ),
            )
          }
        />
      </SimpleGrid>
      <ResonanceFlinchField move={move} onChange={onChange} />
    </>
  );
};
