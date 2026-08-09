import { Card, Collapse, Group, Stack, Switch, Text } from "@mantine/core";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { MoveOverrideFields } from "./MoveOverrideFields";
import {
  setOptionalResonanceField,
  setResonanceHitBreakdown,
  toggleResonance,
} from "@/lib/moves/moveOverrideUpdaters";
import { setMoveField } from "@/lib/moves/moveUpdaters";
import { moveStateOf } from "@/lib/moves/resolveMove";
import { MOVE_FORM_BASE_PHASE } from "./moveFieldsHelpers";

export const MoveResonancePanel = ({
  move,
  onChange,
}: MoveFieldGroupProps) => {
  const hasResonance = move.resonance !== undefined;
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
            <MoveOverrideFields
              move={move}
              state={moveStateOf("resonance", MOVE_FORM_BASE_PHASE)}
              idPrefix={`${move.id}-resonance`}
              value={move.resonance}
              onFieldChange={(key, value) =>
                onChange(setOptionalResonanceField(move, key, value))
              }
              onHitBreakdownChange={(entries) =>
                onChange(setResonanceHitBreakdown(move, entries))
              }
            />
          </Card>
        </Collapse>
      </Stack>
    </Card>
  );
};
