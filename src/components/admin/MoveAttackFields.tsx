import { Select, SimpleGrid } from "@mantine/core";
import { GUARD_LEVELS } from "@/lib/moves/moveEnums";
import { asNullableEnumValue } from "@/lib/optionGuards";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import {
  GUARD_LEVEL_OPTIONS,
  isGrabMove,
  PLACEHOLDER_NO_VALUE,
} from "./moveFieldsHelpers";
import { ResonanceFlinchField } from "./ResonanceFlinchField";
import { StrengthField } from "./StrengthField";
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
  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <StrengthField
          fieldKey={`${move.id}-strength`}
          attackType={move.attackType}
          withAsterisk
          value={move.strength}
          onChange={(value) =>
            onChange(setOptionalMoveField(move, "strength", value))
          }
        />
        <Select
          label="判定"
          placeholder={PLACEHOLDER_NO_VALUE}
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
