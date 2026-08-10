import { useEffect, useState } from "react";
import { Button, Group, Stack, Text } from "@mantine/core";
import {
  draftRowsToPhaseChangePoints,
  phaseChangePointsToDraftRows,
  type PhaseChangePointsDraftRow,
} from "@/lib/moves/phaseChangePoints";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import type { PhaseChangePointsValue } from "@/types/move";
import { DecimalNumberInput } from "./DecimalNumberInput";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { PLACEHOLDER_SET_BY_HIT_BREAKDOWN } from "./moveFieldsHelpers";

export interface PhaseChangePointsFieldProps {
  /** 入力欄の key に使う接頭辞。技単位／各条件付き差分で衝突しない値を渡す。 */
  idPrefix: string;
  description?: string;
  /** ヒット内訳で設定済みでないときの placeholder。技単位は「未計測」、差分は「変化なし」。 */
  unsetPlaceholder: string;
  /** true ならヒット内訳でこの項目が設定済み（併用不可）のため入力を無効化する。 */
  disabled: boolean;
  /**
   * 基礎ダメージが実効的に多段ヒットか（isBaseDamageMultiHit の結果を呼び出し側から渡す）。
   * false（単発技）のときは値の入力欄1つだけを表示し、ヒット数入力・行の追加削除は出さない
   * （単発技には「ヒットごとに違う PCH」という概念が無いため）。
   */
  isMultiHit: boolean;
  value: PhaseChangePointsValue | undefined;
  onChange: (value: PhaseChangePointsValue | undefined) => void;
}

/**
 * PCH値の入力欄。
 *
 * 多段ヒット技（isMultiHit）だけ、1〜N行の「値×ヒット数」を編集できるようにする。
 * ヒットごとに他の性能は変わらず PCH だけ違う技のために、ヒット内訳（HitBreakdownFields）
 * とは独立に任意個の区切りを持てる。単発技には「ヒットごとに違う PCH」という概念が無いため、
 * isMultiHit が false のときは値の入力欄1つだけを表示する（Issue #79 以前の見た目に相当、
 * 小数入力にのみ対応した形）。
 *
 * DamageValueField と同じ理由で、確定できない下書き行（値だけ入れてヒット数は未入力、
 * または追加直後の空行）をローカル state で保持する。呼び出し側は disabled が切り替わる
 * タイミング・対象の技を切り替えるタイミング・isMultiHit が切り替わるタイミングで key を
 * 変えて再マウントさせること（DamageValueField と同じ契約）。isMultiHit を key に含めない
 * と、単発↔多段の切り替えをまたいで rows がローカル state に残ったまま再初期化されず、
 * 古い rows で value を上書きしてしまう。
 */
export const PhaseChangePointsField = ({
  idPrefix,
  description,
  unsetPlaceholder,
  disabled,
  isMultiHit,
  value,
  onChange,
}: PhaseChangePointsFieldProps) => {
  const [rows, setRows] = useState<PhaseChangePointsDraftRow[]>(() =>
    phaseChangePointsToDraftRows(value),
  );

  // 単発技になった（isMultiHit が false になった）のに区切りの配列が残っていると、
  // 単一値の入力欄には出せない値が保存されたままになる。TotalDamageField が
  // 非表示化と同時に値を消すのと同じ理由で、ここでも表示を切り替えると同時に消す。
  useEffect(() => {
    if (!isMultiHit && Array.isArray(value)) {
      onChange(undefined);
    }
  }, [isMultiHit, value, onChange]);

  const updateRows = (nextRows: PhaseChangePointsDraftRow[]) => {
    setRows(nextRows);
    onChange(draftRowsToPhaseChangePoints(nextRows));
  };

  if (!isMultiHit) {
    return (
      <DecimalNumberInput
        label={MOVE_FIELD_LABELS.phaseChangePoints}
        description={description}
        placeholder={
          disabled ? PLACEHOLDER_SET_BY_HIT_BREAKDOWN : unsetPlaceholder
        }
        disabled={disabled}
        min={0}
        value={typeof value === "number" ? value : undefined}
        onChange={onChange}
      />
    );
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        {MOVE_FIELD_LABELS.phaseChangePoints}
      </Text>
      {description !== undefined && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
      <Text size="xs" c="dimmed">
        ヒットごとに PCH が違う場合のみ「ヒット数」を入力してください
      </Text>
      {rows.map((row, index) => (
        <Group
          key={`${idPrefix}-phaseChangePoints-${index}-${rows.length}`}
          gap="xs"
          align="flex-end"
        >
          <DecimalNumberInput
            label={rows.length > 1 ? `PCH値${index + 1}` : "PCH値"}
            placeholder={
              disabled ? PLACEHOLDER_SET_BY_HIT_BREAKDOWN : unsetPlaceholder
            }
            disabled={disabled}
            min={0}
            value={typeof row.perHit === "number" ? row.perHit : undefined}
            onChange={(nextValue) =>
              updateRows(
                rows.map((r, i) =>
                  i === index ? { ...r, perHit: nextValue ?? "" } : r,
                ),
              )
            }
          />
          <IntegerNumberInput
            label="PCH値のヒット数"
            disabled={disabled}
            min={1}
            value={typeof row.hitCount === "number" ? row.hitCount : undefined}
            onChange={(nextValue) =>
              updateRows(
                rows.map((r, i) =>
                  i === index ? { ...r, hitCount: nextValue ?? "" } : r,
                ),
              )
            }
          />
          <Button
            variant="subtle"
            color="red"
            size="compact-xs"
            disabled={disabled || rows.length <= 1}
            onClick={() => updateRows(rows.filter((_, i) => i !== index))}
          >
            削除
          </Button>
        </Group>
      ))}
      <Button
        variant="light"
        size="xs"
        disabled={disabled}
        onClick={() => updateRows([...rows, { perHit: "", hitCount: "" }])}
      >
        PCH値を追加
      </Button>
    </Stack>
  );
};
