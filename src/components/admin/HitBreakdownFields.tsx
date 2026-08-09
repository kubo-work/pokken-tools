import { Button, Card, Group, Select, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import {
  AIR_GROUND_JUDGMENTS,
  GUARD_LEVELS,
  HIT_BREAKDOWN_NUMERIC_KEYS,
  RESONANCE_FLINCH_LEVELS,
} from "@/lib/moves/moveEnums";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { HitBreakdownEntry } from "@/types/move";
import { IntegerNumberInput } from "./IntegerNumberInput";
import {
  AIR_GROUND_OPTIONS,
  GUARD_LEVEL_OPTIONS,
  PLACEHOLDER_NO_VALUE,
  RESONANCE_FLINCH_LEVEL_OPTIONS,
} from "./moveFieldsHelpers";
import {
  addHitBreakdownEntry,
  removeHitBreakdownEntry,
  setHitBreakdownEntryField,
  toggleHitBreakdown,
} from "@/lib/moves/moveHitBreakdownUpdaters";

/**
 * グループごとに入力する数値項目。技単位の入力欄（MoveDamageFields）と同じラベルを使う。
 * 内訳では PCH値もダメージ系と同じ「1ヒットあたりの整数」なので同じ入力欄で扱える。
 */
const HIT_BREAKDOWN_NUMERIC_FIELDS = HIT_BREAKDOWN_NUMERIC_KEYS.map((key) => ({
  key,
  label: MOVE_FIELD_LABELS[key],
}));

export interface HitBreakdownFieldsProps {
  /** グループ入力欄の key に使う接頭辞。技単位/共鳴差分で別の値を渡し、衝突を防ぐ。 */
  idPrefix: string;
  switchLabel: string;
  switchDescription?: string;
  entries: HitBreakdownEntry[] | undefined;
  onChange: (entries: HitBreakdownEntry[] | undefined) => void;
}

/**
 * ヒットごとに性能が変わる技の内訳編集欄。ExceptionsForm と同じ
 * 「Card 配列＋追加/削除ボタン」パターンを踏襲する。技単位（MoveEditor）と
 * 共鳴差分（MoveResonancePanel）の両方から、対象の hitBreakdown 配列を渡して使う。
 *
 * 各グループの入力欄は IntegerNumberInput と同じ「非制御コンポーネントを key で
 * 再マウントさせる」契約に従うため、グループ数が変わる（追加/削除）たびに
 * 全グループの key を変えて再マウントさせ、内容と表示がずれないようにする。
 */
export const HitBreakdownFields = ({
  idPrefix,
  switchLabel,
  switchDescription,
  entries,
  onChange,
}: HitBreakdownFieldsProps) => {
  const enabled = entries !== undefined;
  return (
    <Stack gap="sm">
      <Switch
        label={switchLabel}
        description={switchDescription}
        checked={enabled}
        onChange={(event) =>
          onChange(toggleHitBreakdown(entries, event.currentTarget.checked))
        }
      />
      {enabled && (
        <Stack gap="sm">
          {entries.map((entry, index) => (
            <Card
              key={`${idPrefix}-${index}-${entries.length}`}
              withBorder
              bg="var(--surface-1)"
              padding="sm"
            >
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={600}>
                    グループ{index + 1}
                  </Text>
                  <Button
                    variant="subtle"
                    color="red"
                    size="compact-xs"
                    disabled={entries.length <= 1}
                    onClick={() =>
                      onChange(removeHitBreakdownEntry(entries, index))
                    }
                  >
                    削除
                  </Button>
                </Group>
                <SimpleGrid cols={{ base: 2, sm: 3 }}>
                  <IntegerNumberInput
                    label="ヒット数"
                    description="このグループの連続ヒット数"
                    withAsterisk
                    min={1}
                    value={entry.hitCount}
                    onChange={(value) =>
                      onChange(
                        setHitBreakdownEntryField(
                          entries,
                          index,
                          "hitCount",
                          value ?? 1,
                        ),
                      )
                    }
                  />
                  {HIT_BREAKDOWN_NUMERIC_FIELDS.map(({ key, label }) => (
                    <IntegerNumberInput
                      key={key}
                      label={label}
                      placeholder={PLACEHOLDER_NO_VALUE}
                      min={0}
                      value={entry[key]}
                      onChange={(value) =>
                        onChange(
                          setHitBreakdownEntryField(entries, index, key, value),
                        )
                      }
                    />
                  ))}
                  <Select
                    label="判定"
                    placeholder={PLACEHOLDER_NO_VALUE}
                    clearable
                    data={GUARD_LEVEL_OPTIONS}
                    value={entry.guardLevel ?? null}
                    onChange={(value) =>
                      onChange(
                        setHitBreakdownEntryField(
                          entries,
                          index,
                          "guardLevel",
                          asOptionalEnumValue(value, GUARD_LEVELS),
                        ),
                      )
                    }
                  />
                  <Select
                    label="空・地判定"
                    placeholder={PLACEHOLDER_NO_VALUE}
                    clearable
                    data={AIR_GROUND_OPTIONS}
                    value={entry.airGroundJudgment ?? null}
                    onChange={(value) =>
                      onChange(
                        setHitBreakdownEntryField(
                          entries,
                          index,
                          "airGroundJudgment",
                          asOptionalEnumValue(value, AIR_GROUND_JUDGMENTS),
                        ),
                      )
                    }
                  />
                  <Select
                    label={MOVE_FIELD_LABELS.resonanceFlinch}
                    placeholder={PLACEHOLDER_NO_VALUE}
                    clearable
                    data={RESONANCE_FLINCH_LEVEL_OPTIONS}
                    value={entry.resonanceFlinch ?? null}
                    onChange={(value) =>
                      onChange(
                        setHitBreakdownEntryField(
                          entries,
                          index,
                          "resonanceFlinch",
                          asOptionalEnumValue(value, RESONANCE_FLINCH_LEVELS),
                        ),
                      )
                    }
                  />
                </SimpleGrid>
              </Stack>
            </Card>
          ))}
          <Button
            variant="light"
            size="xs"
            onClick={() => onChange(addHitBreakdownEntry(entries))}
          >
            グループを追加
          </Button>
        </Stack>
      )}
    </Stack>
  );
};
