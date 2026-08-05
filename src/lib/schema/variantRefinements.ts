import type { z } from "zod";
import type { MoveInput } from "./moveObject";

/** ため・派生（子技）と親技の関係、および子技だけが持てる項目の検証。 */

/** ため・派生の親子関係と、ため段階・ガード割り込みの設定先。 */
export const validateVariantRelation = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  const isChildVariant =
    move.variant === "charge" || move.variant === "derivative";
  if (isChildVariant && move.parentMoveId === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["parentMoveId"],
      message: "ため・派生技は親技 ID が必須です",
    });
  }
  if (!isChildVariant && move.parentMoveId !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["parentMoveId"],
      message: "通常技に親技 ID は設定できません",
    });
  }
  if (move.chargeLevel !== undefined && move.variant !== "charge") {
    ctx.addIssue({
      code: "custom",
      path: ["chargeLevel"],
      message: "ため段階はため技 (charge) にのみ設定できます",
    });
  }
  // 通常技には「1つ前の段」が存在しないため、割り込みフレームは値の意味が定まらない。
  if (move.guardInterruptFrames !== undefined && !isChildVariant) {
    ctx.addIssue({
      code: "custom",
      path: ["guardInterruptFrames"],
      message: "ガード割り込みはため・派生技にのみ設定できます",
    });
  }
};
