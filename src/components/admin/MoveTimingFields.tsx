import { SimpleGrid } from "@mantine/core";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { setMoveField, setOptionalMoveField } from "./moveUpdaters";
import { FrameAdvantageField } from "./FrameAdvantageField";
import { IntegerNumberInput } from "./IntegerNumberInput";

export const MoveTimingFields = ({ move, onChange }: MoveFieldGroupProps) => (
  <>
    <SimpleGrid cols={{ base: 2, sm: 3 }}>
      <IntegerNumberInput
        key={`${move.id}-startup`}
        label="発生"
        description="技が出るまでのフレーム"
        withAsterisk
        min={0}
        value={move.startup}
        onChange={(value) =>
          onChange(setMoveField(move, "startup", value ?? 0))
        }
      />
    </SimpleGrid>
    <FrameAdvantageField
      kind="guard"
      inputKeyPrefix={`${move.id}-guardFrameAdvantage`}
      label="ガード硬直差"
      description="攻撃側不利は負の値。当て方で変わる技は範囲"
      withAsterisk
      value={move.guardFrameAdvantage}
      onChange={(value) =>
        onChange(setMoveField(move, "guardFrameAdvantage", value))
      }
      extraField={
        <IntegerNumberInput
          key={`${move.id}-guardFrameAdvantageOnPokemonMoveCancel`}
          label="ポケモン技キャンセル時のガード硬直差"
          description="ポケモン技にキャンセルした場合の硬直差。未計測なら空欄"
          allowNegative
          value={move.guardFrameAdvantageOnPokemonMoveCancel}
          onChange={(value) =>
            onChange(
              setOptionalMoveField(
                move,
                "guardFrameAdvantageOnPokemonMoveCancel",
                value,
              ),
            )
          }
        />
      }
    />
    <FrameAdvantageField
      kind="hit"
      inputKeyPrefix={`${move.id}-hitFrameAdvantage`}
      label="ヒット硬直差"
      description="ダウンする技は「ダウン」"
      value={move.hitFrameAdvantage}
      onChange={(value) =>
        onChange(setOptionalMoveField(move, "hitFrameAdvantage", value))
      }
      extraField={
        <IntegerNumberInput
          key={`${move.id}-hitFrameAdvantageOnPokemonMoveCancel`}
          label="ポケモン技キャンセル時のヒット硬直差"
          description="ポケモン技にキャンセルした場合の硬直差。未計測なら空欄"
          allowNegative
          value={move.hitFrameAdvantageOnPokemonMoveCancel}
          onChange={(value) =>
            onChange(
              setOptionalMoveField(
                move,
                "hitFrameAdvantageOnPokemonMoveCancel",
                value,
              ),
            )
          }
        />
      }
    />
  </>
);
