"use client";

import {
  Card,
  Collapse,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { GUARD_LEVELS, strengthRangeForAttackType } from "@/lib/meta";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { Move } from "@/types/move";
import {
  GUARD_LEVEL_OPTIONS,
  RESONANCE_NUMBER_FIELDS,
} from "./moveFieldsHelpers";
import { FrameNumberInput } from "./FrameNumberInput";
import {
  setMoveField,
  setResonanceGuardLevel,
  setResonanceNumber,
  setResonanceStrength,
  toggleResonance,
} from "./moveUpdaters";

export interface MoveResonancePanelProps {
  move: Move;
  onChange: (move: Move) => void;
}

export const MoveResonancePanel = ({
  move,
  onChange,
}: MoveResonancePanelProps) => {
  const hasResonance = move.resonance !== undefined;
  const strengthRange = strengthRangeForAttackType(move.attackType);
  return (
    <Card withBorder bg="var(--surface-2)" padding="sm">
      <Stack gap="sm">
        <Group gap="xl" wrap="wrap">
          <Switch
            label="共鳴専用"
            description="通常状態では使用不可"
            checked={move.resonanceOnly === true}
            onChange={(event) =>
              onChange(
                setMoveField(
                  move,
                  "resonanceOnly",
                  event.currentTarget.checked ? true : undefined,
                ),
              )
            }
          />
          <Switch
            label="共鳴で性能が変化する"
            description="通常時と共鳴時で発生・硬直・判定などが変わる"
            checked={hasResonance}
            onChange={(event) =>
              onChange(toggleResonance(move, event.currentTarget.checked))
            }
          />
        </Group>
        <Collapse expanded={hasResonance}>
          <Card withBorder bg="var(--surface-1)" padding="sm">
            <Text size="sm" c="dimmed" mb="xs">
              共鳴時に変化する項目だけ入力（空欄は通常時と同じ）
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {RESONANCE_NUMBER_FIELDS.map(({ key, label, negative }) => (
                <FrameNumberInput
                  key={`${move.id}-resonance-${key}`}
                  label={label}
                  allowNegative={negative}
                  min={negative ? undefined : 0}
                  value={move.resonance?.[key]}
                  onChange={(value) =>
                    onChange(
                      setResonanceNumber(move, key, value ?? ""),
                    )
                  }
                />
              ))}
              <NumberInput
                label="強度"
                placeholder={strengthRange === undefined ? "強度なし" : "変化なし"}
                disabled={strengthRange === undefined}
                min={strengthRange?.min}
                max={strengthRange?.max}
                value={move.resonance?.strength ?? ""}
                onChange={(value) =>
                  onChange(
                    setResonanceStrength(
                      move,
                      typeof value === "number" ? value : undefined,
                    ),
                  )
                }
              />
              <Select
                label="判定"
                placeholder="変化なし"
                clearable
                data={GUARD_LEVEL_OPTIONS}
                value={move.resonance?.guardLevel ?? null}
                onChange={(value) =>
                  onChange(
                    setResonanceGuardLevel(
                      move,
                      asOptionalEnumValue(value, GUARD_LEVELS),
                    ),
                  )
                }
              />
            </SimpleGrid>
          </Card>
        </Collapse>
      </Stack>
    </Card>
  );
};
