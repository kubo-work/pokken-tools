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
import { GUARD_LEVELS, MOVE_STRENGTHS } from "@/lib/meta";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { Move } from "@/types/move";
import {
  GUARD_LEVEL_OPTIONS,
  RESONANCE_NUMBER_FIELDS,
  STRENGTH_OPTIONS,
} from "./moveFieldsHelpers";
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
  return (
    <Card withBorder bg="dark.7" padding="sm">
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
          <Card withBorder bg="dark.6" padding="sm">
            <Text size="sm" c="dimmed" mb="xs">
              共鳴時に変化する項目だけ入力（空欄は通常時と同じ）
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 3 }}>
              {RESONANCE_NUMBER_FIELDS.map(({ key, label, negative }) => (
                <NumberInput
                  key={key}
                  label={label}
                  min={negative ? undefined : 0}
                  value={move.resonance?.[key] ?? ""}
                  onChange={(value) =>
                    onChange(setResonanceNumber(move, key, value))
                  }
                />
              ))}
              <Select
                label="強度"
                placeholder="変化なし"
                clearable
                data={STRENGTH_OPTIONS}
                value={move.resonance?.strength ?? null}
                onChange={(value) =>
                  onChange(
                    setResonanceStrength(
                      move,
                      asOptionalEnumValue(value, MOVE_STRENGTHS),
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
