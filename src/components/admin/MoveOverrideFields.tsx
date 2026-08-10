import { Box, NumberInput, Select, SimpleGrid, TextInput } from "@mantine/core";
import { GUARD_LEVELS } from "@/lib/moves/moveEnums";
import {
  hitBreakdownDefines,
  isBaseDamageMultiHit,
  strengthRangeForAttackType,
} from "@/lib/moves/moveRules";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import { resolveMove, type MoveState } from "@/lib/moves/resolveMove";
import type {
  FieldPhaseOverride,
  HitBreakdownEntry,
  Move,
  MoveOverride,
  MoveOverrideBase,
} from "@/types/move";
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
import { PhaseChangePointsField } from "./PhaseChangePointsField";
import { TotalDamageField } from "./TotalDamageField";

/** 上書き差分の入力欄が共通で受け取るもの。上書きの形ごとに Override を差し替える。 */
interface OverrideFieldsProps<Override extends MoveOverrideBase> {
  /** 差分の元になる技本体。強度の入力可能範囲（攻撃属性依存）の判定に使う。 */
  move: Move;
  /**
   * この差分パネルが表す条件（共鳴／ジャスト入力／共鳴中のジャスト入力／FP）。
   * 合計ダメージ欄の表示条件（その条件下で基礎ダメージが実効的に多段ヒットか）の判定に、
   * resolveMove でこの技を解決するために使う。
   */
  state: MoveState;
  /** 入力欄の key に使う接頭辞。共鳴/ジャスト入力/共鳴中のジャスト/FP で衝突しない値を渡す。 */
  idPrefix: string;
  value: Override | undefined;
  onFieldChange: <Key extends keyof Override>(
    key: Key,
    value: Override[Key] | undefined,
  ) => void;
  onHitBreakdownChange: (entries: HitBreakdownEntry[] | undefined) => void;
}

export type MoveOverrideFieldsProps = OverrideFieldsProps<MoveOverride>;
export type MoveFieldPhaseOverrideFieldsProps =
  OverrideFieldsProps<FieldPhaseOverride>;

/**
 * ヒット内訳スイッチのラベルと説明。どの条件（共鳴／ジャスト入力）の差分かは囲んでいる
 * パネルが示すため、ここでは条件名を名乗らない。条件名を重ねると「その条件の中でさらに
 * 同じ条件を設定できる」ように読めてしまうため、呼び出し側から差し替えられないようにしている。
 */
const HIT_BREAKDOWN_SWITCH_LABEL = "ヒットごとに性能が変わる";
const HIT_BREAKDOWN_SWITCH_DESCRIPTION =
  "通常時とヒットごとの内訳が異なる場合のみ ON";

/**
 * 発生・硬直差・強度・ダメージ系・PCH値・ヒット内訳の入力欄群。
 * 「通常時からの差分」という共通の形（MoveOverrideBase）を、共鳴差分・ジャスト入力差分・
 * 共鳴中のジャスト入力差分・フィールドフェイズ差分で使い回すため、MoveResonancePanel から切り出した。
 * 条件ごとに固有の項目（共鳴・ジャストの判定、FP のコマンド）は、
 * 下の MoveOverrideFields / MoveFieldPhaseOverrideFields がそれぞれ足す。
 */
/** 差分の入力欄が共通で受け取るもの。値の読み取り元と、変更の通知先。 */
interface OverrideFieldGroupProps {
  idPrefix: string;
  value: MoveOverrideBase | undefined;
  onFieldChange: <Key extends keyof MoveOverrideBase>(
    key: Key,
    value: MoveOverrideBase[Key] | undefined,
  ) => void;
}

/** 発生・硬直差・強度。入力可能な強度の範囲は技本体の攻撃属性で決まる。 */
const OverrideFrameFields = ({
  move,
  idPrefix,
  value,
  onFieldChange,
}: OverrideFieldGroupProps & { move: Move }) => {
  const strengthRange = strengthRangeForAttackType(move.attackType);
  return (
    <>
      {MOVE_OVERRIDE_NUMBER_FIELDS.map(({ key, label, negative, min }) => (
        <IntegerNumberInput
          key={`${idPrefix}-${key}`}
          label={label}
          allowNegative={negative}
          min={min}
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
    </>
  );
};

/** ダメージ系と PCH 値。ヒット内訳で設定済みの項目は入力を無効化する（併用不可のため）。 */
const OverrideDamageFields = ({
  move,
  state,
  idPrefix,
  value,
  onFieldChange,
}: OverrideFieldGroupProps & { move: Move; state: MoveState }) => {
  // この条件下で実効的に基礎ダメージが多段ヒットかどうかは、resonance/justInput/fieldPhase
  // のどの層が実際に baseDamage/hitBreakdown を定義しているかに依るため、この差分自体が
  // 再定義していなくても（技本体や他の層から継承していても）resolveMove で正しく解決する。
  const resolved = resolveMove(move, state);
  const isMultiHit = isBaseDamageMultiHit(resolved.baseDamage, resolved.hitBreakdown);
  return (
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
      <Box style={{ gridColumn: "1 / -1" }}>
        <PhaseChangePointsField
          key={`${idPrefix}-phaseChangePoints-${hitBreakdownDefines(value?.hitBreakdown, "phaseChangePoints")}-${isMultiHit}`}
          idPrefix={idPrefix}
          unsetPlaceholder={PLACEHOLDER_UNCHANGED}
          disabled={hitBreakdownDefines(value?.hitBreakdown, "phaseChangePoints")}
          isMultiHit={isMultiHit}
          value={value?.phaseChangePoints}
          onChange={(nextValue) => onFieldChange("phaseChangePoints", nextValue)}
        />
      </Box>
      <TotalDamageField
        idPrefix={idPrefix}
        show={isMultiHit}
        placeholder={PLACEHOLDER_UNCHANGED}
        value={value?.totalDamage}
        onChange={(nextValue) => onFieldChange("totalDamage", nextValue)}
      />
    </>
  );
};

/** 共鳴・ジャスト入力の差分の入力欄。共通項目に加え、これらの条件で変わりうる判定を持つ。 */
export const MoveOverrideFields = ({
  move,
  state,
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
      <OverrideDamageFields
        move={move}
        state={state}
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

/**
 * フィールドフェイズ差分の入力欄。共通項目に加え、フェイズで入力そのものが変わる技のための
 * コマンドを持つ。判定はフェイズで変わらないため入力欄自体を出さない（FieldPhaseOverride 参照）。
 */
export const MoveFieldPhaseOverrideFields = ({
  move,
  state,
  idPrefix,
  value,
  onFieldChange,
  onHitBreakdownChange,
}: MoveFieldPhaseOverrideFieldsProps) => (
  <>
    <SimpleGrid cols={{ base: 2, sm: 3 }}>
      <TextInput
        label="コマンド"
        placeholder={PLACEHOLDER_UNCHANGED}
        value={value?.command ?? ""}
        onChange={(event) =>
          onFieldChange(
            "command",
            event.currentTarget.value === ""
              ? undefined
              : event.currentTarget.value,
          )
        }
      />
      <OverrideFrameFields
        move={move}
        idPrefix={idPrefix}
        value={value}
        onFieldChange={onFieldChange}
      />
      <OverrideDamageFields
        move={move}
        state={state}
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
