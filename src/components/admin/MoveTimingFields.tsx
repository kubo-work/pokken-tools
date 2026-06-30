"use client";

import { SimpleGrid } from "@mantine/core";
import type { Move } from "@/types/move";
import { setMoveField } from "./moveUpdaters";
import { IntegerNumberInput } from "./IntegerNumberInput";

export interface MoveTimingFieldsProps {
  move: Move;
  onChange: (move: Move) => void;
}

export const MoveTimingFields = ({ move, onChange }: MoveTimingFieldsProps) => (
  <SimpleGrid cols={{ base: 2, sm: 3 }}>
    <IntegerNumberInput
      key={`${move.id}-startup`}
      label="発生"
      description="技が出るまでのフレーム"
      min={0}
      value={move.startup}
      onChange={(value) =>
        onChange(setMoveField(move, "startup", value ?? 0))
      }
    />
    <IntegerNumberInput
      key={`${move.id}-guardFrameAdvantage`}
      label="ガード硬直差"
      description="攻撃側不利は負の値（wiki の値をそのまま）"
      allowNegative
      value={move.guardFrameAdvantage}
      onChange={(value) =>
        onChange(setMoveField(move, "guardFrameAdvantage", value ?? 0))
      }
    />
    <IntegerNumberInput
      key={`${move.id}-hitFrameAdvantage`}
      label="ヒット硬直差"
      description="任意。空欄なら未計測"
      allowNegative
      value={move.hitFrameAdvantage}
      onChange={(value) =>
        onChange(setMoveField(move, "hitFrameAdvantage", value))
      }
    />
  </SimpleGrid>
);
