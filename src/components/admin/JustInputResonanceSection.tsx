import { Card, Collapse, Group, Switch, Text } from "@mantine/core";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { MoveOverrideFields } from "./MoveOverrideFields";
import {
  setJustInputResonanceHitBreakdown,
  setOptionalJustInputResonanceField,
  toggleJustInputResonance,
} from "@/lib/moves/moveOverrideUpdaters";
import { justInputResonanceStateOf } from "@/lib/moves/variantMoves";
import { MOVE_FORM_BASE_PHASE } from "./moveFieldsHelpers";

/**
 * 「共鳴中はジャスト入力の性能がさらに変わる」差分の編集欄。
 * ジャスト入力パネルの中に置く前提で、未設定なら共鳴中も通常時のジャスト値が使われる。
 */
export const JustInputResonanceSection = ({
  move,
  onChange,
}: MoveFieldGroupProps) => {
  const hasJustInputResonance = move.justInput?.resonance !== undefined;
  return (
    <>
      <Group mt="sm">
        <Switch
          label="共鳴中はジャスト入力の性能がさらに変わる"
          description="未指定なら共鳴中も上のジャスト入力値をそのまま使う"
          checked={hasJustInputResonance}
          onChange={(event) =>
            onChange(toggleJustInputResonance(move, event.currentTarget.checked))
          }
        />
      </Group>
      <Collapse expanded={hasJustInputResonance}>
        <Card withBorder bg="var(--surface-2)" padding="sm" mt="xs">
          <Text size="sm" c="dimmed" mb="xs">
            共鳴中のジャスト入力で変化する項目だけ入力（空欄は上のジャスト入力値と同じ）
          </Text>
          <MoveOverrideFields
            move={move}
            state={justInputResonanceStateOf(MOVE_FORM_BASE_PHASE)}
            idPrefix={`${move.id}-justInput-resonance`}
            value={move.justInput?.resonance}
            onFieldChange={(key, value) =>
              onChange(setOptionalJustInputResonanceField(move, key, value))
            }
            onHitBreakdownChange={(entries) =>
              onChange(setJustInputResonanceHitBreakdown(move, entries))
            }
          />
        </Card>
      </Collapse>
    </>
  );
};
