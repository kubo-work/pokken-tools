"use client";

import { NumberInput, Select, SimpleGrid } from "@mantine/core";
import { asNullableEnumValue } from "@/lib/optionGuards";
import type { Move } from "@/types/move";
import {
  DEFAULT_SWITCH_ACTIVE_FRAME,
  RESONANCE_FLINCH_MODES,
  RESONANCE_FLINCH_OPTIONS,
  type ResonanceFlinchMode,
} from "./moveFieldsHelpers";
import { setMoveResonanceFlinchMode } from "./moveUpdaters";

export interface ResonanceFlinchFieldProps {
  move: Move;
  onChange: (move: Move) => void;
}

/**
 * 共鳴怯ませ強度の入力欄。共鳴中の相手を怯ませられるか（弱／強）を選び、
 * 出始め弱→途中から強の技は「弱→強」モードで切替フレームを別途入力する。
 * つかみ技は持たないため、呼び出し側で表示を制御する。
 */
export const ResonanceFlinchField = ({
  move,
  onChange,
}: ResonanceFlinchFieldProps) => {
  // object（切替）なら "transition"、それ以外は値そのものを現在モードとする。
  const resonanceFlinch = move.resonanceFlinch;
  const switchActiveFrame =
    typeof resonanceFlinch === "object"
      ? resonanceFlinch.switchActiveFrame
      : undefined;
  const mode: ResonanceFlinchMode | null =
    resonanceFlinch === undefined
      ? null
      : typeof resonanceFlinch === "object"
        ? "transition"
        : resonanceFlinch;
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <Select
        label="共鳴怯ませ"
        description="共鳴中の相手を怯ませられるか"
        placeholder="なし"
        clearable
        data={RESONANCE_FLINCH_OPTIONS}
        value={mode}
        onChange={(value) =>
          onChange(
            setMoveResonanceFlinchMode(
              move,
              asNullableEnumValue(value, RESONANCE_FLINCH_MODES),
              switchActiveFrame,
            ),
          )
        }
      />
      {mode === "transition" && (
        <NumberInput
          label="強に変わる持続フレーム"
          description="この持続フレーム目以降が「強」"
          min={1}
          value={switchActiveFrame ?? DEFAULT_SWITCH_ACTIVE_FRAME}
          onChange={(value) =>
            onChange(
              setMoveResonanceFlinchMode(
                move,
                "transition",
                typeof value === "number" ? value : undefined,
              ),
            )
          }
        />
      )}
    </SimpleGrid>
  );
};
