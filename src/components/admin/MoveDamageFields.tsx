import { Box, SimpleGrid } from "@mantine/core";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { hitBreakdownDefines, isBaseDamageMultiHit } from "@/lib/moves/moveRules";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { DamageValueField } from "./DamageValueField";
import { PhaseChangePointsField } from "./PhaseChangePointsField";
import { TotalDamageField } from "./TotalDamageField";
import {
  PLACEHOLDER_NOT_MEASURED,
  PLACEHOLDER_SET_BY_HIT_BREAKDOWN,
} from "./moveFieldsHelpers";
import {
  HIT_BREAKDOWN_DAMAGE_KEYS,
  type HitBreakdownDamageKey,
} from "@/lib/moves/moveEnums";
import { setOptionalMoveField } from "@/lib/moves/moveUpdaters";

/**
 * ダメージ系（DamageValue 型）フィールドの一覧。共鳴差分パネルでも同じ並びで使う。
 * キー集合から導出することで、並びと項目が moveEnums の定義と食い違わないようにする。
 */
export const DAMAGE_VALUE_FIELDS: {
  key: HitBreakdownDamageKey;
  label: string;
}[] = HIT_BREAKDOWN_DAMAGE_KEYS.map((key) => ({
  key,
  label: MOVE_FIELD_LABELS[key],
}));

/**
 * ダメージ系（基礎/削り/ガード削り/PCH値）の入力欄。全項目任意で、空欄は未計測扱い。
 * ヒット内訳（hitBreakdown）が定義済みの項目は、schema の相互排他ルールに合わせて
 * ここでの入力を無効化する（内訳側の入力欄を使う）。
 */
export const MoveDamageFields = ({ move, onChange }: MoveFieldGroupProps) => {
  const isMultiHit = isBaseDamageMultiHit(move.baseDamage, move.hitBreakdown);
  const pchDisabledByBreakdown = hitBreakdownDefines(
    move.hitBreakdown,
    "phaseChangePoints",
  );
  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }}>
      {DAMAGE_VALUE_FIELDS.map(({ key, label }) => {
        const disabledByBreakdown = hitBreakdownDefines(move.hitBreakdown, key);
        return (
          <DamageValueField
            // disabled 切替時に DamageValueField 内部の非制御 draft state を
            // 破棄するため、key に disabledByBreakdown を含めて強制的に再マウントする。
            key={`${move.id}-${key}-${disabledByBreakdown}`}
            label={label}
            placeholder={
              disabledByBreakdown
                ? PLACEHOLDER_SET_BY_HIT_BREAKDOWN
                : PLACEHOLDER_NOT_MEASURED
            }
            disabled={disabledByBreakdown}
            value={move[key]}
            onChange={(value) => onChange(setOptionalMoveField(move, key, value))}
          />
        );
      })}
      <Box style={{ gridColumn: "1 / -1" }}>
        <PhaseChangePointsField
          key={`${move.id}-phaseChangePoints-${pchDisabledByBreakdown}-${isMultiHit}`}
          idPrefix={move.id}
          description="フェイズチェンジポイント"
          unsetPlaceholder={PLACEHOLDER_NOT_MEASURED}
          disabled={pchDisabledByBreakdown}
          isMultiHit={isMultiHit}
          value={move.phaseChangePoints}
          onChange={(value) =>
            onChange(setOptionalMoveField(move, "phaseChangePoints", value))
          }
        />
      </Box>
      <TotalDamageField
        idPrefix={move.id}
        show={isMultiHit}
        placeholder={PLACEHOLDER_NOT_MEASURED}
        value={move.totalDamage}
        onChange={(value) =>
          onChange(setOptionalMoveField(move, "totalDamage", value))
        }
      />
    </SimpleGrid>
  );
};
