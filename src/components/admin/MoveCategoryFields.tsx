import { Select, SimpleGrid } from "@mantine/core";
import { MOVE_ATTACK_TYPES, MOVE_CATEGORIES } from "@/lib/moves/moveEnums";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import {
  ATTACK_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  isGrabMove,
} from "./moveFieldsHelpers";
import { setMoveAttackType, setMoveCategory } from "@/lib/moves/moveUpdaters";

/**
 * 属性（攻撃／ブロック／つかみ）と攻撃属性（打撃／弾）の入力欄。
 *
 * 属性なしの技は攻撃しないため攻撃属性を持たず、つかみも攻撃属性を持たないので、
 * どちらの場合も攻撃属性の入力欄は出さない。属性を変えたときの
 * 関連項目のクリアは setMoveCategory / setMoveAttackType 側が受け持つ。
 */
export const MoveCategoryFields = ({
  move,
  onChange,
}: MoveFieldGroupProps) => {
  const hasCategory = move.category !== undefined;
  const isGrab = isGrabMove(move);
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <Select
        label="属性"
        placeholder="なし"
        clearable
        data={CATEGORY_OPTIONS}
        value={move.category ?? null}
        onChange={(value) =>
          onChange(
            setMoveCategory(move, asOptionalEnumValue(value, MOVE_CATEGORIES)),
          )
        }
      />
      {hasCategory && !isGrab && (
        <Select
          label="攻撃属性"
          placeholder="なし（攻撃しない技）"
          clearable
          data={ATTACK_TYPE_OPTIONS}
          value={move.attackType ?? null}
          onChange={(value) =>
            onChange(
              setMoveAttackType(
                move,
                asOptionalEnumValue(value, MOVE_ATTACK_TYPES),
              ),
            )
          }
        />
      )}
    </SimpleGrid>
  );
};
