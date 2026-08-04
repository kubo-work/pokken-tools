import { Checkbox, Group, SimpleGrid } from "@mantine/core";
import { MOVE_SPECIAL_ATTRIBUTES } from "@/lib/moves/moveEnums";
import { SPECIAL_ATTRIBUTE_META } from "@/lib/moves/moveLabels";
import { pickEnumValues } from "@/lib/optionGuards";
import { IntegerNumberInput } from "./IntegerNumberInput";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { PLACEHOLDER_NOT_MEASURED } from "./moveFieldsHelpers";
import { setMoveSpecialAttributes, setOptionalMoveField } from "@/lib/moves/moveUpdaters";

/**
 * 特殊属性（貫通・アーマー・弾消し）と、それに連動する弾消し開始フレームの入力欄。
 * 開始フレームは「弾消し」を持つ技にのみ設定できる（schema で検証）ため、
 * 選択されているときだけ入力欄を出す。属性を外したときの値のクリアは
 * setMoveSpecialAttributes 側が受け持つ。
 */
export const MoveSpecialAttributeFields = ({
  move,
  onChange,
}: MoveFieldGroupProps) => {
  const hasProjectileNullify =
    move.specialAttributes?.includes("projectileNullify") ?? false;
  return (
    <>
      <Checkbox.Group
        label="特殊属性（複数可・なくても可）"
        value={move.specialAttributes ?? []}
        onChange={(value) => {
          onChange(
            setMoveSpecialAttributes(
              move,
              pickEnumValues(value, MOVE_SPECIAL_ATTRIBUTES),
            ),
          );
        }}
      >
        <Group gap="md" mt={6}>
          {MOVE_SPECIAL_ATTRIBUTES.map((specialAttribute) => (
            <Checkbox
              key={specialAttribute}
              value={specialAttribute}
              label={SPECIAL_ATTRIBUTE_META[specialAttribute].label}
            />
          ))}
        </Group>
      </Checkbox.Group>

      {hasProjectileNullify && (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <IntegerNumberInput
            key={`${move.id}-projectileNullifyStartFrame`}
            label="弾消し開始フレーム"
            description="動作開始を1F目とした経過フレーム"
            placeholder={PLACEHOLDER_NOT_MEASURED}
            min={1}
            value={move.projectileNullifyStartFrame}
            onChange={(value) =>
              onChange(
                setOptionalMoveField(move, "projectileNullifyStartFrame", value),
              )
            }
          />
        </SimpleGrid>
      )}
    </>
  );
};
