import { Select, SimpleGrid } from "@mantine/core";
import { AIR_GROUND_JUDGMENTS } from "@/lib/moves/moveEnums";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import { MoveAttackFields } from "./MoveAttackFields";
import { MoveCategoryFields } from "./MoveCategoryFields";
import { MoveIdentityFields } from "./MoveIdentityFields";
import { MoveSpecialAttributeFields } from "./MoveSpecialAttributeFields";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { AIR_GROUND_OPTIONS } from "./moveFieldsHelpers";
import { setOptionalMoveField } from "@/lib/moves/moveUpdaters";

export interface MoveFieldsProps extends MoveFieldGroupProps {
  isChild: boolean;
}

/**
 * 技の基本項目（技名・コマンド・属性・強度・判定・空地・特殊属性）の入力欄。
 * 項目群ごとに表示条件が異なるため、条件をそれぞれのコンポーネント側に閉じ込め、
 * ここは並び順だけを持つ。ため・派生固有の項目は MoveChildVariantFields が担う。
 */
export const MoveFields = ({ move, isChild, onChange }: MoveFieldsProps) => (
  <>
    <MoveIdentityFields move={move} isChild={isChild} onChange={onChange} />
    <MoveCategoryFields move={move} onChange={onChange} />
    <MoveAttackFields move={move} onChange={onChange} />

    {/* 表示条件を持たない唯一の項目のため、専用コンポーネントには切り出さずここに置く。 */}
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <Select
        label="空・地判定"
        description="上中下段とは別軸の判定。任意"
        placeholder="なし"
        clearable
        data={AIR_GROUND_OPTIONS}
        value={move.airGroundJudgment ?? null}
        onChange={(value) =>
          onChange(
            setOptionalMoveField(
              move,
              "airGroundJudgment",
              asOptionalEnumValue(value, AIR_GROUND_JUDGMENTS),
            ),
          )
        }
      />
    </SimpleGrid>

    <MoveSpecialAttributeFields move={move} onChange={onChange} />
  </>
);
