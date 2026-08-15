import { Button, Card, Group, Select, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import {
  AIR_GROUND_JUDGMENTS,
  GUARD_LEVELS,
  HIT_BREAKDOWN_DAMAGE_KEYS,
  MOVE_ATTACK_TYPES,
  RESONANCE_FLINCH_LEVELS,
} from "@/lib/moves/moveEnums";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { HitBreakdownEntry, MoveAttackType } from "@/types/move";
import { DecimalNumberInput } from "./DecimalNumberInput";
import { IntegerNumberInput } from "./IntegerNumberInput";
import {
  AIR_GROUND_OPTIONS,
  ATTACK_TYPE_OPTIONS,
  GUARD_LEVEL_OPTIONS,
  PLACEHOLDER_NO_VALUE,
  RESONANCE_FLINCH_LEVEL_OPTIONS,
} from "./moveFieldsHelpers";
import { StrengthField } from "./StrengthField";
import {
  addHitBreakdownEntry,
  removeHitBreakdownEntry,
  setHitBreakdownEntryAttackType,
  setHitBreakdownEntryField,
  toggleHitBreakdown,
} from "@/lib/moves/moveHitBreakdownUpdaters";

/**
 * グループごとに入力するダメージ系の数値項目。技単位の入力欄（MoveDamageFields）と同じラベルを使う。
 * PCH値だけ小数を許すため（DecimalNumberInput）、この一覧には含めず別に描画する。
 */
const HIT_BREAKDOWN_DAMAGE_FIELDS = HIT_BREAKDOWN_DAMAGE_KEYS.map((key) => ({
  key,
  label: MOVE_FIELD_LABELS[key],
}));

/** グループ 1 件分の入力欄。配列操作は親が担い、ここは 1 グループの値だけを扱う。 */
interface HitBreakdownEntryCardProps {
  entry: HitBreakdownEntry;
  /** 見出し「グループN」に使う 0 始まりの位置。 */
  index: number;
  /** グループが 1 件だけのときは削除できない（スキーマ上 1 件以上必須）。 */
  canRemove: boolean;
  onRemove: () => void;
  onFieldChange: <Key extends keyof HitBreakdownEntry>(
    key: Key,
    value: HitBreakdownEntry[Key] | undefined,
  ) => void;
  /**
   * グループの攻撃属性の変更専用。属性が変わると許容される強度の範囲も変わるため、
   * onFieldChange の単一フィールド更新ではなく、強度の見直しも合わせて行う専用の
   * 更新関数（setHitBreakdownEntryAttackType）を親から渡してもらう。
   */
  onAttackTypeChange: (attackType: MoveAttackType | undefined) => void;
  /** 強度の入力範囲を決めるための技単位の攻撃属性。グループ側が未設定のときの基準。 */
  moveAttackType: MoveAttackType | undefined;
}

const HitBreakdownEntryCard = ({
  entry,
  index,
  canRemove,
  onRemove,
  onFieldChange,
  onAttackTypeChange,
  moveAttackType,
}: HitBreakdownEntryCardProps) => {
  // 強度の入力可能な値は攻撃属性で決まる。グループが攻撃属性を持たなければ技単位の値を基準にする。
  const entryAttackType = entry.attackType ?? moveAttackType;
  return (
    <Card withBorder bg="var(--surface-1)" padding="sm">
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={600}>
            グループ{index + 1}
          </Text>
          <Button
            variant="subtle"
            color="red"
            size="compact-xs"
            disabled={!canRemove}
            onClick={onRemove}
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
            onChange={(value) => onFieldChange("hitCount", value ?? 1)}
          />
          {HIT_BREAKDOWN_DAMAGE_FIELDS.map(({ key, label }) => (
            <IntegerNumberInput
              key={key}
              label={label}
              placeholder={PLACEHOLDER_NO_VALUE}
              min={0}
              value={entry[key]}
              onChange={(value) => onFieldChange(key, value)}
            />
          ))}
          <DecimalNumberInput
            label={MOVE_FIELD_LABELS.phaseChangePoints}
            placeholder={PLACEHOLDER_NO_VALUE}
            min={0}
            value={entry.phaseChangePoints}
            onChange={(value) => onFieldChange("phaseChangePoints", value)}
          />
          <Select
            label="判定"
            placeholder={PLACEHOLDER_NO_VALUE}
            clearable
            data={GUARD_LEVEL_OPTIONS}
            value={entry.guardLevel ?? null}
            onChange={(value) =>
              onFieldChange("guardLevel", asOptionalEnumValue(value, GUARD_LEVELS))
            }
          />
          <Select
            label="空・地判定"
            placeholder={PLACEHOLDER_NO_VALUE}
            clearable
            data={AIR_GROUND_OPTIONS}
            value={entry.airGroundJudgment ?? null}
            onChange={(value) =>
              onFieldChange(
                "airGroundJudgment",
                asOptionalEnumValue(value, AIR_GROUND_JUDGMENTS),
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
              onFieldChange(
                "resonanceFlinch",
                asOptionalEnumValue(value, RESONANCE_FLINCH_LEVELS),
              )
            }
          />
          <Select
            label="攻撃属性"
            placeholder={PLACEHOLDER_NO_VALUE}
            clearable
            data={ATTACK_TYPE_OPTIONS}
            value={entry.attackType ?? null}
            onChange={(value) =>
              onAttackTypeChange(asOptionalEnumValue(value, MOVE_ATTACK_TYPES))
            }
          />
          <StrengthField
            fieldKey="strength"
            attackType={entryAttackType}
            placeholder={PLACEHOLDER_NO_VALUE}
            value={entry.strength}
            onChange={(value) => onFieldChange("strength", value)}
          />
        </SimpleGrid>
      </Stack>
    </Card>
  );
};

export interface HitBreakdownFieldsProps {
  /** グループ入力欄の key に使う接頭辞。技単位/共鳴差分で別の値を渡し、衝突を防ぐ。 */
  idPrefix: string;
  switchLabel: string;
  switchDescription?: string;
  entries: HitBreakdownEntry[] | undefined;
  onChange: (entries: HitBreakdownEntry[] | undefined) => void;
  /**
   * 技単位の攻撃属性。グループが攻撃属性を省略したときの強度の入力可能範囲の基準に使う
   * （範囲は攻撃属性ごとに決まるため）。技本体・各上書き層のどのパネルから開いても
   * 技単位の値は共通のため、呼び出し側は常に move.attackType を渡す。
   */
  moveAttackType: MoveAttackType | undefined;
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
  moveAttackType,
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
            <HitBreakdownEntryCard
              key={`${idPrefix}-${index}-${entries.length}`}
              entry={entry}
              index={index}
              canRemove={entries.length > 1}
              onRemove={() => onChange(removeHitBreakdownEntry(entries, index))}
              onFieldChange={(key, value) =>
                onChange(setHitBreakdownEntryField(entries, index, key, value))
              }
              onAttackTypeChange={(attackType) =>
                onChange(
                  setHitBreakdownEntryAttackType(
                    entries,
                    index,
                    attackType,
                    moveAttackType,
                  ),
                )
              }
              moveAttackType={moveAttackType}
            />
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
