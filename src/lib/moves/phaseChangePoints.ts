import type {
  PhaseChangePointsSegment,
  PhaseChangePointsValue,
} from "@/types/move";

/**
 * PCH値入力欄の編集中の1行。値・ヒット数のどちらも、まだ数値として確定していない
 * 空欄の下書き状態を表現するため number ではなく number | string を持つ
 * （DamageValueField の下書き state と同じ理由）。
 */
export interface PhaseChangePointsDraftRow {
  perHit: number | string;
  hitCount: number | string;
}

/**
 * 保存値を編集行に展開する。
 * - 未設定なら空欄1行。
 * - 単一値（number）なら、その値をヒット数欄が空欄の1行。
 * - 区切りの配列なら、各区切りをそのまま1行ずつに対応させる。
 */
export const phaseChangePointsToDraftRows = (
  value: PhaseChangePointsValue | undefined,
): PhaseChangePointsDraftRow[] => {
  if (value === undefined) {
    return [{ perHit: "", hitCount: "" }];
  }
  if (typeof value === "number") {
    return [{ perHit: value, hitCount: "" }];
  }
  return value.map((segment) => ({
    perHit: segment.perHit,
    hitCount: segment.hitCount,
  }));
};

/**
 * 編集行から保存値を組み立てる。
 * - perHit が数値として確定していない行（空欄の下書き）は無視する。
 * - 有効な行が1つも無ければ undefined（未計測）。
 * - 有効な行が1つだけで、ヒット数が未入力または1以下なら単一値（number）にする
 *   （同じ内容を「3.5」と「[{perHit:3.5,hitCount:1}]」の2通りで保存する揺れを防ぐ）。
 * - それ以外（行が複数、またはヒット数が2以上）は区切りの配列にする。
 */
export const draftRowsToPhaseChangePoints = (
  rows: PhaseChangePointsDraftRow[],
): PhaseChangePointsValue | undefined => {
  const segments: PhaseChangePointsSegment[] = rows.flatMap((row) =>
    typeof row.perHit === "number"
      ? [
          {
            perHit: row.perHit,
            hitCount: typeof row.hitCount === "number" ? row.hitCount : 1,
          },
        ]
      : [],
  );
  if (segments.length === 0) {
    return undefined;
  }
  if (segments.length === 1 && segments[0].hitCount <= 1) {
    return segments[0].perHit;
  }
  return segments;
};
