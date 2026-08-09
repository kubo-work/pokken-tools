import type { z } from "zod";
import {
  damageValueHitCount,
  hitBreakdownTotalHitCount,
  MULTI_HIT_MIN_COUNT,
} from "@/lib/moves/moveRules";
import {
  createPathIssueReporter,
  effectiveLayer,
  VALIDATED_STATES,
  validationLayersOf,
  type ValidationLayer,
} from "./refinementLayers";
import type { MoveInput } from "./moveObject";

/**
 * その状態で実効の基礎ダメージが表すヒット数。
 * ヒット内訳を持つ状態なら内訳の総ヒット数、持たなければ単一値（perHit×hitCount / 単発）の
 * ヒット数を使う。どちらも無ければ 0（基礎ダメージ未入力）。
 */
const effectiveBaseDamageHitCount = (layers: ValidationLayer[]): number => {
  const hitBreakdown = effectiveLayer(
    layers,
    (layer) => layer.values.hitBreakdown !== undefined,
  )?.values.hitBreakdown;
  if (hitBreakdown !== undefined) {
    return hitBreakdownTotalHitCount(hitBreakdown);
  }
  const baseDamage = effectiveLayer(
    layers,
    (layer) => layer.values.baseDamage !== undefined,
  )?.values.baseDamage;
  return damageValueHitCount(baseDamage);
};

/**
 * 合計ダメージ（totalDamage）は実測値で、コンボ補正のため perHit×hitCount やヒット内訳の
 * 総和とは一致しない多段ヒット技のためだけに意味を持つ。単発技や基礎ダメージ未入力の技にまで
 * 入力を許すと、実質「基礎ダメージの言い換え」を二重管理することになるため、その状態で実効の
 * 基礎ダメージが多段ヒットである技にのみ設定できるよう制限する。
 *
 * resolveMove と同じ適用順（validationLayersOf 経由）で各状態の実効値を求め、
 * 「その状態で totalDamage を定義した層があるとき、同じ状態の基礎ダメージが多段か」を見る。
 */
export const validateTotalDamageRequiresMultiHit = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  const reportOnce = createPathIssueReporter(ctx);
  for (const state of VALIDATED_STATES) {
    const layers = validationLayersOf(move, state);
    const totalDamageLayer = effectiveLayer(
      layers,
      (layer) => layer.values.totalDamage !== undefined,
    );
    if (totalDamageLayer === undefined) {
      continue;
    }
    if (effectiveBaseDamageHitCount(layers) >= MULTI_HIT_MIN_COUNT) {
      continue;
    }
    reportOnce(
      [...totalDamageLayer.path, "totalDamage"],
      "合計ダメージは基礎ダメージが多段ヒットの技にのみ設定できます",
    );
  }
};
