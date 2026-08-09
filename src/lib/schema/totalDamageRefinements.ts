import type { z } from "zod";
import { isBaseDamageMultiHit } from "@/lib/moves/moveRules";
import {
  effectiveLayer,
  VALIDATED_STATES,
  validationLayersOf,
  type ValidationLayer,
} from "./refinementLayers";
import type { MoveInput } from "./moveObject";

/**
 * その状態で実効の基礎ダメージが多段ヒットか。
 * ヒット内訳と単一値は別々の層が定義しうるため、それぞれ層をまたいで実効値を求めてから
 * 共通の判定（isBaseDamageMultiHit）にかける。
 */
const isEffectiveBaseDamageMultiHit = (layers: ValidationLayer[]): boolean =>
  isBaseDamageMultiHit(
    effectiveLayer(layers, (layer) => layer.values.baseDamage !== undefined)
      ?.values.baseDamage,
    effectiveLayer(layers, (layer) => layer.values.hitBreakdown !== undefined)
      ?.values.hitBreakdown,
  );

/**
 * 合計ダメージ（totalDamage）は実測値で、コンボ補正のため perHit×hitCount やヒット内訳の
 * 総和とは一致しない多段ヒット技のためだけに意味を持つ。単発技や基礎ダメージ未入力の技にまで
 * 入力を許すと、実質「基礎ダメージの言い換え」を二重管理することになるため、多段ヒットの
 * 技にのみ設定できるよう制限する。
 *
 * 咎めるのは「その値を入力した層」であり、値が継承されるだけの状態ではない。上書き層は
 * 加算的で、ある層が定義した値は他の状態にも引き継がれるため（例: 技本体＝DP が多段で
 * 合計ダメージを持ち、fieldPhase が基礎ダメージを単発へ上書きする技）、状態ごとに実効層を
 * 咎めると「DP のために入力した正当な値」が FP 状態の判定で弾かれ、どこに入力しても
 * 保存できなくなる。そこで層ごとに「その層が実効となる状態のいずれかで多段ヒットか」を見て、
 * 一度も意味を持たない層だけを咎める。
 *
 * 継承されただけの状態（上の例の FP）では合計ダメージが表示されないよう、状態解決側
 * （resolveMove）が多段でない状態の totalDamage を落とす。
 */
export const validateTotalDamageRequiresMultiHit = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  /**
   * 合計ダメージが実効となる層。報告先パスをキーにするため、同じ入力欄へ指摘が重複しない。
   */
  const totalDamageLayerByPath = new Map<string, ValidationLayer>();
  /** そのうち、実効となる状態のいずれかで基礎ダメージが多段ヒットだった層。 */
  const multiHitLayerPaths = new Set<string>();
  for (const state of VALIDATED_STATES) {
    const layers = validationLayersOf(move, state);
    const totalDamageLayer = effectiveLayer(
      layers,
      (layer) => layer.values.totalDamage !== undefined,
    );
    if (totalDamageLayer === undefined) {
      continue;
    }
    const layerPathKey = totalDamageLayer.path.join(".");
    totalDamageLayerByPath.set(layerPathKey, totalDamageLayer);
    if (isEffectiveBaseDamageMultiHit(layers)) {
      multiHitLayerPaths.add(layerPathKey);
    }
  }
  for (const [layerPathKey, layer] of totalDamageLayerByPath) {
    if (multiHitLayerPaths.has(layerPathKey)) {
      continue;
    }
    ctx.addIssue({
      code: "custom",
      path: [...layer.path, "totalDamage"],
      message: "合計ダメージは基礎ダメージが多段ヒットの技にのみ設定できます",
    });
  }
};
