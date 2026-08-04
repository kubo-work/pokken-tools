import { NumberInput, Select, SimpleGrid } from "@mantine/core";
import { GUARD_LEVELS } from "@/lib/moves/moveEnums";
import {
  hitBreakdownDefines,
  strengthRangeForAttackType,
} from "@/lib/moves/moveRules";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { HitBreakdownEntry, Move, MoveOverride } from "@/types/move";
import {
  GUARD_LEVEL_OPTIONS,
  PLACEHOLDER_SET_BY_HIT_BREAKDOWN,
  PLACEHOLDER_UNCHANGED,
  MOVE_OVERRIDE_NUMBER_FIELDS,
} from "./moveFieldsHelpers";
import { DamageValueField } from "./DamageValueField";
import { HitBreakdownFields } from "./HitBreakdownFields";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { DAMAGE_VALUE_FIELDS } from "./MoveDamageFields";

export interface MoveOverrideFieldsProps {
  /** 差分の元になる技本体。強度の入力可能範囲（攻撃属性依存）の判定に使う。 */
  move: Move;
  /** 入力欄の key に使う接頭辞。共鳴/ジャスト入力/共鳴中のジャストで衝突しない値を渡す。 */
  idPrefix: string;
  value: MoveOverride | undefined;
  onFieldChange: <Key extends keyof MoveOverride>(
    key: Key,
    value: MoveOverride[Key] | undefined,
  ) => void;
  onHitBreakdownChange: (entries: HitBreakdownEntry[] | undefined) => void;
}

/**
 * ヒット内訳スイッチのラベルと説明。どの条件（共鳴／ジャスト入力）の差分かは囲んでいる
 * パネルが示すため、ここでは条件名を名乗らない。条件名を重ねると「その条件の中でさらに
 * 同じ条件を設定できる」ように読めてしまうため、呼び出し側から差し替えられないようにしている。
 */
const HIT_BREAKDOWN_SWITCH_LABEL = "ヒットごとに性能が変わる";
const HIT_BREAKDOWN_SWITCH_DESCRIPTION =
  "通常時とヒットごとの内訳が異なる場合のみ ON";

/**
 * 発生・硬直差・強度・判定・ダメージ系・PCH値・ヒット内訳の入力欄群。
 * 「通常時からの差分」という同じ形（MoveOverride）を、共鳴差分・ジャスト入力差分・
 * 共鳴中のジャスト入力差分の3箇所で使い回すため、MoveResonancePanel から切り出した。
 */
/** 差分の入力欄が共通で受け取るもの。値の読み取り元と、変更の通知先。 */
interface OverrideFieldGroupProps {
  idPrefix: string;
  value: MoveOverride | undefined;
  onFieldChange: MoveOverrideFieldsProps["onFieldChange"];
}

/** 発生・硬直差・強度・判定。入力可能な強度の範囲は技本体の攻撃属性で決まる。 */
const OverrideFrameFields = ({
  move,
  idPrefix,
  value,
  onFieldChange,
}: OverrideFieldGroupProps & { move: Move }) => {
  const strengthRange = strengthRangeForAttackType(move.attackType);
  return (
    <>
      {MOVE_OVERRIDE_NUMBER_FIELDS.map(({ key, label, negative }) => (
        <IntegerNumberInput
          key={`${idPrefix}-${key}`}
          label={label}
          allowNegative={negative}
          min={negative ? undefined : 0}
          value={value?.[key]}
          onChange={(nextValue) => onFieldChange(key, nextValue)}
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
        value={value?.strength ?? ""}
        onChange={(nextValue) =>
          onFieldChange(
            "strength",
            typeof nextValue === "number" ? nextValue : undefined,
          )
        }
      />
      <Select
        label="判定"
        placeholder={PLACEHOLDER_UNCHANGED}
        clearable
        data={GUARD_LEVEL_OPTIONS}
        value={value?.guardLevel ?? null}
        onChange={(nextValue) =>
          onFieldChange("guardLevel", asOptionalEnumValue(nextValue, GUARD_LEVELS))
        }
      />
    </>
  );
};

/** ダメージ系と PCH 値。ヒット内訳で設定済みの項目は入力を無効化する（併用不可のため）。 */
const OverrideDamageFields = ({
  idPrefix,
  value,
  onFieldChange,
}: OverrideFieldGroupProps) => (
  <>
    {DAMAGE_VALUE_FIELDS.map(({ key, label }) => {
      const disabledByBreakdown = hitBreakdownDefines(value?.hitBreakdown, key);
      return (
        <DamageValueField
          // disabled 切替時に DamageValueField 内部の非制御 draft state を
          // 破棄するため、key に disabledByBreakdown を含めて強制的に再マウントする。
          key={`${idPrefix}-${key}-${disabledByBreakdown}`}
          label={label}
          placeholder={
            disabledByBreakdown
              ? PLACEHOLDER_SET_BY_HIT_BREAKDOWN
              : PLACEHOLDER_UNCHANGED
          }
          disabled={disabledByBreakdown}
          value={value?.[key]}
          onChange={(nextValue) => onFieldChange(key, nextValue)}
        />
      );
    })}
    <IntegerNumberInput
      key={`${idPrefix}-phaseChangePoints`}
      label="PCH値"
      placeholder={PLACEHOLDER_UNCHANGED}
      min={0}
      value={value?.phaseChangePoints}
      onChange={(nextValue) => onFieldChange("phaseChangePoints", nextValue)}
    />
  </>
);

export const MoveOverrideFields = ({
  move,
  idPrefix,
  value,
  onFieldChange,
  onHitBreakdownChange,
}: MoveOverrideFieldsProps) => (
  <>
    <SimpleGrid cols={{ base: 2, sm: 3 }}>
      <OverrideFrameFields
        move={move}
        idPrefix={idPrefix}
        value={value}
        onFieldChange={onFieldChange}
      />
      <OverrideDamageFields
        idPrefix={idPrefix}
        value={value}
        onFieldChange={onFieldChange}
      />
    </SimpleGrid>
    <HitBreakdownFields
      idPrefix={`${idPrefix}-hitBreakdown`}
      switchLabel={HIT_BREAKDOWN_SWITCH_LABEL}
      switchDescription={HIT_BREAKDOWN_SWITCH_DESCRIPTION}
      entries={value?.hitBreakdown}
      onChange={onHitBreakdownChange}
    />
  </>
);
