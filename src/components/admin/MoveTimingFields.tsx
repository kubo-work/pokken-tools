"use client";

import { SimpleGrid } from "@mantine/core";
import type { Move } from "@/types/move";
import { setMoveField, setOptionalMoveField } from "./moveUpdaters";
import { FrameAdvantageField } from "./FrameAdvantageField";
import { IntegerNumberInput } from "./IntegerNumberInput";

export interface MoveTimingFieldsProps {
  move: Move;
  onChange: (move: Move) => void;
}

export const MoveTimingFields = ({ move, onChange }: MoveTimingFieldsProps) => (
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
    />
  </>
);
