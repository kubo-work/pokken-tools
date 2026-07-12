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
import { GUARD_LEVELS, hitBreakdownDefines, strengthRangeForAttackType } from "@/lib/meta";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { Move } from "@/types/move";
import {
  GUARD_LEVEL_OPTIONS,
  PLACEHOLDER_SET_BY_HIT_BREAKDOWN,
  PLACEHOLDER_UNCHANGED,
  RESONANCE_NUMBER_FIELDS,
} from "./moveFieldsHelpers";
import { DamageValueField } from "./DamageValueField";
import { HitBreakdownFields } from "./HitBreakdownFields";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { DAMAGE_VALUE_FIELDS } from "./MoveDamageFields";
import {
  setMoveField,
  setOptionalResonanceField,
  setResonanceHitBreakdown,
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
                <IntegerNumberInput
                  key={`${move.id}-resonance-${key}`}
                  label={label}
                  allowNegative={negative}
                  min={negative ? undefined : 0}
                  value={move.resonance?.[key]}
                  onChange={(value) =>
                    onChange(setOptionalResonanceField(move, key, value))
                  }
                />
              ))}
              <NumberInput
                label="強度"
                placeholder={
                  strengthRange === undefined ? "強度なし" : PLACEHOLDER_UNCHANGED
                }
                disabled={strengthRange === undefined}
                min={strengthRange?.min}
                max={strengthRange?.max}
                value={move.resonance?.strength ?? ""}
                onChange={(value) =>
                  onChange(
                    setOptionalResonanceField(
                      move,
                      "strength",
                      typeof value === "number" ? value : undefined,
                    ),
                  )
                }
              />
              <Select
                label="判定"
                placeholder={PLACEHOLDER_UNCHANGED}
                clearable
                data={GUARD_LEVEL_OPTIONS}
                value={move.resonance?.guardLevel ?? null}
                onChange={(value) =>
                  onChange(
                    setOptionalResonanceField(
                      move,
                      "guardLevel",
                      asOptionalEnumValue(value, GUARD_LEVELS),
                    ),
                  )
                }
              />
              {DAMAGE_VALUE_FIELDS.map(({ key, label }) => {
                const disabledByBreakdown = hitBreakdownDefines(
                  move.resonance?.hitBreakdown,
                  key,
                );
                return (
                  <DamageValueField
                    // disabled 切替時に DamageValueField 内部の非制御 draft state を
                    // 破棄するため、key に disabledByBreakdown を含めて強制的に再マウントする。
                    key={`${move.id}-resonance-${key}-${disabledByBreakdown}`}
                    label={label}
                    placeholder={
                      disabledByBreakdown
                        ? PLACEHOLDER_SET_BY_HIT_BREAKDOWN
                        : PLACEHOLDER_UNCHANGED
                    }
                    disabled={disabledByBreakdown}
                    value={move.resonance?.[key]}
                    onChange={(value) =>
                      onChange(setOptionalResonanceField(move, key, value))
                    }
                  />
                );
              })}
              <IntegerNumberInput
                key={`${move.id}-resonance-phaseChangePoints`}
                label="PCH値"
                placeholder={PLACEHOLDER_UNCHANGED}
                min={0}
                value={move.resonance?.phaseChangePoints}
                onChange={(value) =>
                  onChange(
                    setOptionalResonanceField(move, "phaseChangePoints", value),
                  )
                }
              />
            </SimpleGrid>
            <HitBreakdownFields
              idPrefix={`${move.id}-resonance-hitBreakdown`}
              switchLabel="共鳴中はヒットごとに性能が変わる"
              switchDescription="通常時と共鳴中でヒットごとの内訳が異なる場合のみ ON"
              entries={move.resonance?.hitBreakdown}
              onChange={(entries) =>
                onChange(setResonanceHitBreakdown(move, entries))
              }
            />
          </Card>
        </Collapse>
      </Stack>
    </Card>
  );
};
