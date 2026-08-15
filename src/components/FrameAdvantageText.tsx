import type { GuardFrameAdvantage, HitFrameAdvantage } from "@/types/move";
import { HIT_FRAME_ADVANTAGE_DOWN_LABEL } from "@/lib/moves/moveLabels";
import { FrameNumber } from "./FrameNumber";

/**
 * ガード/ヒット硬直差の共通表示。
 * - 単一値: FrameNumber（符号付き・有利不利の色分け）
 * - 範囲（当て方で変わる技）: 「min〜max」を両端それぞれ色分け
 *   片側が未計測（飛び道具など計測が難しい技）なら、その側を省略して「min〜」「〜max」と表示する
 * - "down"（相手がダウンする技）: 「ダウン」
 */
export const FrameAdvantageText = ({
  value,
}: {
  value: GuardFrameAdvantage | HitFrameAdvantage;
}) => {
  if (value === "down") {
    return <span>{HIT_FRAME_ADVANTAGE_DOWN_LABEL}</span>;
  }
  if (typeof value === "number") {
    return <FrameNumber value={value} />;
  }
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      {value.min !== undefined && <FrameNumber value={value.min} />}
      〜
      {value.max !== undefined && <FrameNumber value={value.max} />}
    </span>
  );
};
