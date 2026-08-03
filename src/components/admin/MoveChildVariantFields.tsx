import { SimpleGrid } from "@mantine/core";
import { IntegerNumberInput } from "./IntegerNumberInput";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { PLACEHOLDER_NOT_MEASURED } from "./moveFieldsHelpers";
import { setMoveField, setOptionalMoveField } from "./moveUpdaters";

/**
 * ため・派生（子技）のときだけ意味を持つ項目の入力欄。
 * 通常技には親も「1つ前の段」も無いためこれらの項目を持てない（schema で検証）ので、
 * 呼び出し側は子技のときだけこのコンポーネントを描画すること。
 *
 * ため段階はさらにため技 (charge) 限定のため、この中で variant を見て出し分ける。
 */
export const MoveChildVariantFields = ({
  move,
  onChange,
}: MoveFieldGroupProps) => (
  <SimpleGrid cols={{ base: 1, sm: 2 }}>
    {move.variant === "charge" && (
      <IntegerNumberInput
        key={`${move.id}-chargeLevel`}
        label="ため段階"
        withAsterisk
        min={1}
        value={move.chargeLevel ?? 1}
        onChange={(value) =>
          onChange(setMoveField(move, "chargeLevel", value ?? 1))
        }
      />
    )}
    <IntegerNumberInput
      key={`${move.id}-guardInterruptFrames`}
      label="ガード割り込み"
      description="1つ前の段との隙間フレーム。0 は連続ガード"
      placeholder={PLACEHOLDER_NOT_MEASURED}
      min={0}
      value={move.guardInterruptFrames}
      onChange={(value) =>
        onChange(setOptionalMoveField(move, "guardInterruptFrames", value))
      }
    />
  </SimpleGrid>
);
