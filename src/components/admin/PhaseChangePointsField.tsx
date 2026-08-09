import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import type { HitBreakdownEntry } from "@/types/move";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { PLACEHOLDER_SET_BY_HIT_BREAKDOWN } from "./moveFieldsHelpers";

export interface PhaseChangePointsFieldProps {
  /** 入力欄の key に使う接頭辞。技単位／各条件付き差分で衝突しない値を渡す。 */
  idPrefix: string;
  description?: string;
  /** ヒット内訳で設定済みでないときの placeholder。技単位は「未計測」、差分は「変化なし」。 */
  unsetPlaceholder: string;
  /** 相互排他の判定に使う、同じ層のヒット内訳。 */
  hitBreakdown: HitBreakdownEntry[] | undefined;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

/**
 * PCH値の入力欄。技単位（MoveDamageFields）と条件付き差分（MoveOverrideFields）で
 * placeholder と説明文以外は同じ振る舞いのため、1 箇所にまとめる。
 * ヒット内訳が PCH値を定義していれば、schema の相互排他ルールに合わせて入力を無効化する
 * （内訳側の入力欄を使う）。
 */
export const PhaseChangePointsField = ({
  idPrefix,
  description,
  unsetPlaceholder,
  hitBreakdown,
  value,
  onChange,
}: PhaseChangePointsFieldProps) => {
  const setByHitBreakdown = hitBreakdownDefines(
    hitBreakdown,
    "phaseChangePoints",
  );
  return (
    <IntegerNumberInput
      // disabled 切替時に IntegerNumberInput 内部の非制御状態を破棄するため、
      // key に setByHitBreakdown を含めて強制的に再マウントする。
      key={`${idPrefix}-phaseChangePoints-${setByHitBreakdown}`}
      label={MOVE_FIELD_LABELS.phaseChangePoints}
      description={description}
      placeholder={
        setByHitBreakdown ? PLACEHOLDER_SET_BY_HIT_BREAKDOWN : unsetPlaceholder
      }
      disabled={setByHitBreakdown}
      min={0}
      value={value}
      onChange={onChange}
    />
  );
};
