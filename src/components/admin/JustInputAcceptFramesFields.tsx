import { SimpleGrid } from "@mantine/core";
import type { MoveFieldGroupProps } from "./moveFieldProps";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { PLACEHOLDER_NOT_MEASURED } from "./moveFieldsHelpers";
import { setJustInputAcceptFrames } from "@/lib/moves/moveOverrideUpdaters";

/** 受付フレームの開始・終了。同じ更新規則を両方の入力欄で使うため、境界の種別だけを引数にする。 */
type AcceptFrameEdge = "start" | "end";

/** ジャスト入力の受付フレーム範囲（開始・終了）の入力欄。 */
export const JustInputAcceptFramesFields = ({
  move,
  onChange,
}: MoveFieldGroupProps) => {
  const acceptFrames = move.justInput?.acceptFrames;

  /**
   * 片側だけを更新する。もう片方が未入力の間は入力値で埋めて start <= end
   * （schema の制約）を満たす範囲にし、空欄にしたら範囲ごと削除する。
   */
  const updateEdge = (edge: AcceptFrameEdge, value: number | undefined): void => {
    if (value === undefined) {
      onChange(setJustInputAcceptFrames(move, undefined));
      return;
    }
    onChange(
      setJustInputAcceptFrames(move, {
        start: edge === "start" ? value : (acceptFrames?.start ?? value),
        end: edge === "end" ? value : (acceptFrames?.end ?? value),
      }),
    );
  };

  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }} mb="sm">
      <IntegerNumberInput
        key={`${move.id}-justInput-acceptFrames-start`}
        label="ジャスト受付開始フレーム"
        description="動作開始を1F目とした経過フレーム"
        placeholder={PLACEHOLDER_NOT_MEASURED}
        min={1}
        value={acceptFrames?.start}
        onChange={(value) => updateEdge("start", value)}
      />
      <IntegerNumberInput
        key={`${move.id}-justInput-acceptFrames-end`}
        label="ジャスト受付終了フレーム"
        placeholder={PLACEHOLDER_NOT_MEASURED}
        min={1}
        value={acceptFrames?.end}
        onChange={(value) => updateEdge("end", value)}
      />
    </SimpleGrid>
  );
};
