import type { z } from "zod";
import { HIT_BREAKDOWN_NUMERIC_KEYS } from "@/lib/moves/moveEnums";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import {
  createPathIssueReporter,
  effectiveLayer,
  VALIDATED_STATES,
  validationLayersOf,
} from "./refinementLayers";
import type { MoveInput } from "./moveObject";

/** ヒットごとの内訳と、技単位・条件付き差分の単一値との整合性検証。 */

/**
 * ヒット内訳と数値項目の単一値は併用できない（どちらが実効値か決まらないため）。
 *
 * 所有者ごとの組み合わせを列挙すると条件軸が増えるたびに漏れるので、resolveMove と同じ
 * 適用順で4状態それぞれの実効値を求め、「その状態で内訳と単一値が同居していないか」だけを見る。
 * 同じ指摘が複数状態から出るため、報告先（path + キー）で重複を除く。
 */
export const validateHitBreakdownExclusions = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  const reportOnce = createPathIssueReporter(ctx);
  for (const state of VALIDATED_STATES) {
    const layers = validationLayersOf(move, state);
    const breakdownLayer = effectiveLayer(
      layers,
      (layer) => layer.values.hitBreakdown !== undefined,
    );
    if (breakdownLayer === undefined) {
      continue;
    }
    for (const key of HIT_BREAKDOWN_NUMERIC_KEYS) {
      if (!hitBreakdownDefines(breakdownLayer.values.hitBreakdown, key)) {
        continue;
      }
      const valueLayer = effectiveLayer(
        layers,
        (layer) => layer.values[key] !== undefined,
      );
      if (valueLayer === undefined) {
        continue;
      }
      reportOnce(
        [...valueLayer.path, key],
        `${breakdownLayer.label}のヒット内訳で設定済みの項目は、${valueLayer.label}の単一値と併用できません`,
      );
    }
  }
};
