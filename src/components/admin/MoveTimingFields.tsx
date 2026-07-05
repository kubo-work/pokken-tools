"use client";

import { SimpleGrid } from "@mantine/core";
import type { Move } from "@/types/move";
import {
  setMoveField,
  setMoveGuardFrameAdvantage,
  setMoveHitFrameAdvantage,
} from "./moveUpdaters";
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
      inputKeyPrefix={`${move.id}-guardFrameAdvantage`}
      label="ガード硬直差"
      description="攻撃側不利は負の値。当て方で変わる技は範囲"
      withAsterisk
      clearable={false}
      allowDown={false}
      value={move.guardFrameAdvantage}
      onChange={(value) =>
        // ガード硬直差は必須項目。allowDown=false のため "down" は来ない。
        onChange(
          setMoveGuardFrameAdvantage(
            move,
            value === undefined || value === "down" ? 0 : value,
          ),
        )
      }
    />
    <FrameAdvantageField
      inputKeyPrefix={`${move.id}-hitFrameAdvantage`}
      label="ヒット硬直差"
      description="ダウンする技は「ダウン」"
      clearable
      allowDown
      value={move.hitFrameAdvantage}
      onChange={(value) => onChange(setMoveHitFrameAdvantage(move, value))}
    />
  </>
);
