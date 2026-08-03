import { Card, Collapse, Stack, Switch, Text } from "@mantine/core";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { JustInputAcceptFramesFields } from "./JustInputAcceptFramesFields";
import { JustInputResonanceSection } from "./JustInputResonanceSection";
import { MoveOverrideFields } from "./MoveOverrideFields";
import {
  setJustInputHitBreakdown,
  setOptionalJustInputField,
  toggleJustInput,
} from "./moveOverrideUpdaters";

/**
 * ジャスト入力による性能差の編集欄。共鳴とは独立した軸のため、共鳴の ON/OFF に関わらず
 * 常に表示する。共鳴中だけジャストの値がさらに変わる技向けに、入れ子で
 * 「共鳴中は別値」差分（justInput.resonance）も編集できる。
 */
export const MoveJustInputPanel = ({ move, onChange }: MoveFieldGroupProps) => {
  const hasJustInput = move.justInput !== undefined;
  return (
    <Card withBorder bg="var(--surface-2)" padding="sm">
      <Stack gap="sm">
        <Switch
          label="ジャスト入力で性能が変化する"
          description="入力タイミングによって発生・硬直・ダメージなどが変わる"
          checked={hasJustInput}
          onChange={(event) =>
            onChange(toggleJustInput(move, event.currentTarget.checked))
          }
        />
        <Collapse expanded={hasJustInput}>
          <Card withBorder bg="var(--surface-1)" padding="sm">
            <Text size="sm" c="dimmed" mb="xs">
              ジャスト入力時に変化する項目だけ入力（空欄は通常時と同じ）
            </Text>
            <JustInputAcceptFramesFields move={move} onChange={onChange} />
            <MoveOverrideFields
              move={move}
              idPrefix={`${move.id}-justInput`}
              value={move.justInput}
              onFieldChange={(key, value) =>
                onChange(setOptionalJustInputField(move, key, value))
              }
              onHitBreakdownChange={(entries) =>
                onChange(setJustInputHitBreakdown(move, entries))
              }
            />

            <JustInputResonanceSection move={move} onChange={onChange} />
          </Card>
        </Collapse>
      </Stack>
    </Card>
  );
};
