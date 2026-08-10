import { useState } from "react";
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
  value: PhaseChangePointsValue | undefined;
  onChange: (value: PhaseChangePointsValue | undefined) => void;
}

/**
 * PCH値の入力欄。1〜N行の「値×ヒット数」を編集する。ヒットごとに他の性能は変わらず
 * PCH だけ違う技のために、ヒット内訳（HitBreakdownFields）とは独立に任意個の区切りを持てる。
 *
 * DamageValueField と同じ理由で、確定できない下書き行（値だけ入れてヒット数は未入力、
 * または追加直後の空行）をローカル state で保持する。呼び出し側は disabled が切り替わる
 * タイミング・対象の技を切り替えるタイミングで key を変えて再マウントさせること
 * （DamageValueField と同じ契約）。
 */
export const PhaseChangePointsField = ({
  idPrefix,
  description,
  unsetPlaceholder,
  disabled,
  value,
  onChange,
}: PhaseChangePointsFieldProps) => {
  const [rows, setRows] = useState<PhaseChangePointsDraftRow[]>(() =>
    phaseChangePointsToDraftRows(value),
  );

  const updateRows = (nextRows: PhaseChangePointsDraftRow[]) => {
    setRows(nextRows);
    onChange(draftRowsToPhaseChangePoints(nextRows));
  };

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
            description="ヒットごとに PCH が違う場合のみ入力"
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
