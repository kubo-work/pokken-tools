"use client";

import { NumberInput, SimpleGrid } from "@mantine/core";
import type { Move } from "@/types/move";
import { toNumber } from "./moveFieldsHelpers";
import { setMoveField } from "./moveUpdaters";

export interface MoveTimingFieldsProps {
  move: Move;
  onChange: (move: Move) => void;
}

export const MoveTimingFields = ({ move, onChange }: MoveTimingFieldsProps) => (
  <SimpleGrid cols={{ base: 2, sm: 2 }}>
    <NumberInput
      label="発生"
      min={0}
      value={move.startup}
      onChange={(value) =>
        onChange(setMoveField(move, "startup", toNumber(value)))
      }
    />
    <NumberInput
      label="硬直F"
      min={0}
      value={move.recovery}
      onChange={(value) =>
        onChange(setMoveField(move, "recovery", toNumber(value)))
      }
    />
  </SimpleGrid>
);
