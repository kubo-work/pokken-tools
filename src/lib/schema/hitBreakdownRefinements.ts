import type { z } from "zod";
import { HIT_BREAKDOWN_NUMERIC_KEYS } from "@/lib/moves/moveEnums";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import { allValidationLayers } from "./refinementLayers";
import type { MoveInput } from "./moveObject";

/** ヒットごとの内訳と、技単位・条件付き差分の単一値との整合性検証。 */

/**
 * 同じ条件（層）の中では、ヒット内訳と数値項目の単一値を同じ項目に併用できない。
 * どちらが実効値か決める手がかりが無いため。
 *
 * 層をまたぐ場合は禁止しない。上書き層には適用順があり、後の層が勝つ（resolveMove の
 * applyOverrideLayer が負けた側を落とす）ため曖昧さが無く、むしろ「DP は内訳で多段、FP は
 * 内訳を使わず単発」のように層をまたぐ組み合わせでしか表せない技がある。
 */
export const validateHitBreakdownExclusions = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  for (const layer of allValidationLayers(move)) {
    const { hitBreakdown } = layer.values;
    if (hitBreakdown === undefined) {
      continue;
    }
    for (const key of HIT_BREAKDOWN_NUMERIC_KEYS) {
      if (
        !hitBreakdownDefines(hitBreakdown, key) ||
        layer.values[key] === undefined
      ) {
        continue;
      }
      ctx.addIssue({
        code: "custom",
        path: [...layer.path, key],
        message: `${layer.label}のヒット内訳で設定済みの項目は、同じ${layer.label}の単一値と併用できません`,
      });
    }
  }
};
