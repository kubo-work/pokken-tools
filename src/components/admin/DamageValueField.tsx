import { useState } from "react";
import { NumberInput } from "@mantine/core";
import type { DamageValue } from "@/types/move";
import { PLACEHOLDER_NOT_MEASURED } from "./moveFieldsHelpers";

export interface DamageValueFieldProps {
  label: string;
  /** 値入力の placeholder。技本体は「未計測」、共鳴差分は「変化なし」。 */
  placeholder?: string;
  value: DamageValue | undefined;
  /** true ならヒット内訳でこの項目が設定済み（併用不可）のため入力を無効化する。 */
  disabled?: boolean;
  onChange: (value: DamageValue | undefined) => void;
}

/**
 * ダメージ系の入力欄。「値」と「ヒット数」の 2 入力で表す。
 * - 値が空欄 → 未計測 (undefined)
 * - ヒット数が空欄 → 単発技（数値のみ）
 * - 両方入力 → 多段技（値×ヒット数）
 *
 * ヒット数だけ先に入力されると DamageValue では表現できない下書き状態になるため、
 * 両入力の下書きをローカル state で保持し、確定できる組み合わせだけを onChange に流す。
 * 別の技を選び直したときは、呼び出し側で key（例 `${move.id}-baseDamage`）を付けて
 * 再マウントさせること（IntegerNumberInput と同じ契約）。
 */
export const DamageValueField = ({
  label,
  placeholder = PLACEHOLDER_NOT_MEASURED,
  value,
  disabled = false,
  onChange,
}: DamageValueFieldProps) => {
  const [perHitDraft, setPerHitDraft] = useState<number | string>(
    typeof value === "object" ? value.perHit : (value ?? ""),
  );
  const [hitCountDraft, setHitCountDraft] = useState<number | string>(
    typeof value === "object" ? value.hitCount : "",
  );

  const emitChange = (
    nextPerHit: number | string,
    nextHitCount: number | string,
  ) => {
    if (typeof nextPerHit !== "number") {
      onChange(undefined);
      return;
    }
    onChange(
      typeof nextHitCount === "number"
        ? { perHit: nextPerHit, hitCount: nextHitCount }
        : nextPerHit,
    );
  };

  return (
    <>
      <NumberInput
        label={label}
        placeholder={placeholder}
        disabled={disabled}
        allowDecimal={false}
        min={0}
        value={perHitDraft}
        onChange={(nextValue) => {
          setPerHitDraft(nextValue);
          emitChange(nextValue, hitCountDraft);
        }}
      />
      <NumberInput
        label={`${label}のヒット数`}
        description="多段技のみ（例: 20×3 の 3）"
        disabled={disabled}
        allowDecimal={false}
        min={2}
        value={hitCountDraft}
        onChange={(nextValue) => {
          setHitCountDraft(nextValue);
          emitChange(perHitDraft, nextValue);
        }}
      />
    </>
  );
};
