import { Card, Collapse, Stack, Switch, Text } from "@mantine/core";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { MoveFieldPhaseOverrideFields } from "./MoveOverrideFields";
import {
  setFieldPhaseHitBreakdown,
  setOptionalFieldPhaseField,
  toggleFieldPhase,
} from "@/lib/moves/moveOverrideUpdaters";
import { moveStateOf } from "@/lib/moves/resolveMove";

/** 共通技（commonMoves）の技フォームにのみ表示する、フィールドフェイズでの性能上書きパネル。 */
export const MoveFieldPhasePanel = ({
  move,
  onChange,
}: MoveFieldGroupProps) => {
  const hasFieldPhase = move.fieldPhase !== undefined;
  return (
    <Card withBorder bg="var(--surface-2)" padding="sm">
      <Stack gap="sm">
        <Switch
          label="フィールドフェイズで性能が変化する"
          description="デュエルフェイズと発生・硬直・判定などが異なる場合のみ ON"
          checked={hasFieldPhase}
          onChange={(event) =>
            onChange(toggleFieldPhase(move, event.currentTarget.checked))
          }
        />
        <Collapse expanded={hasFieldPhase}>
          <Card withBorder bg="var(--surface-1)" padding="sm">
            <Text size="sm" c="dimmed" mb="xs">
              フィールドフェイズで変化する項目だけ入力（空欄はデュエルフェイズと同じ）。
              判定・攻撃属性・空地判定・特殊属性はフェイズで変わらないため入力欄はありません。
            </Text>
            <MoveFieldPhaseOverrideFields
              move={move}
              state={moveStateOf("normal", "field")}
              idPrefix={`${move.id}-fieldPhase`}
              value={move.fieldPhase}
              onFieldChange={(key, value) =>
                onChange(setOptionalFieldPhaseField(move, key, value))
              }
              onHitBreakdownChange={(entries) =>
                onChange(setFieldPhaseHitBreakdown(move, entries))
              }
            />
          </Card>
        </Collapse>
      </Stack>
    </Card>
  );
};
