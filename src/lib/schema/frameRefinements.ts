import type { z } from "zod";
import {
  createPathIssueReporter,
  effectiveLayer,
  VALIDATED_STATES,
  validationLayersOf,
} from "./refinementLayers";
import type { MoveInput } from "./moveObject";

/**
 * フレーム値を持つ項目（弾消し開始フレーム・攻撃持続）の制約。
 * いずれも動作開始を 1F 目とした絶対フレームで、
 * 「設定できる技か」「他のフレーム項目と矛盾しないか」を見る。
 */

/** 弾消し開始フレームは特殊属性「弾消し」を持つ技にだけ設定できる。 */
export const validateProjectileNullify = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  if (
    move.projectileNullifyStartFrame !== undefined &&
    !(move.specialAttributes?.includes("projectileNullify") ?? false)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["projectileNullifyStartFrame"],
      message: "弾消し開始フレームは特殊属性「弾消し」を持つ技にのみ設定できます",
    });
  }
};

/**
 * 攻撃持続は、実効値（共鳴×ジャスト入力の4状態それぞれで実際に効く値）として比較したとき
 * 発生F以降でなければならない。resolveMove と同じ適用順（validationLayersOf 経由）で
 * 各状態の実効 startup / activeUntilFrame を求め、両者を比較する。
 *
 * 比較する2つの値は別の層に由来しうる（例: 攻撃持続は技単位、発生は共鳴時の上書き）ため、
 * メッセージには発生を定義した層のラベルを添える。これが無いと、報告先の入力欄に
 * 表示されている発生と、メッセージ中の発生が食い違って見える。
 */
export const validateActiveUntilFrame = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  const reportOnce = createPathIssueReporter(ctx);
  for (const state of VALIDATED_STATES) {
    const layers = validationLayersOf(move, state);
    const activeUntilLayer = effectiveLayer(
      layers,
      (layer) => layer.values.activeUntilFrame !== undefined,
    );
    if (activeUntilLayer?.values.activeUntilFrame === undefined) {
      continue;
    }
    const startupLayer = effectiveLayer(
      layers,
      (layer) => layer.values.startup !== undefined,
    );
    // 先頭層は技本体で startup を必ず持つため実際には成立しないが、
    // 層の探索結果として undefined を除いてラベルと値を確定させる。
    if (startupLayer?.values.startup === undefined) {
      continue;
    }
    const effectiveStartup = startupLayer.values.startup;
    if (activeUntilLayer.values.activeUntilFrame >= effectiveStartup) {
      continue;
    }
    reportOnce(
      [...activeUntilLayer.path, "activeUntilFrame"],
      `攻撃持続は${startupLayer.label}の発生（${effectiveStartup}F）以降のフレームを指定してください`,
    );
  }
};
