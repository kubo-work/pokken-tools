import type { z } from "zod";
import { ATTACK_TYPE_META } from "@/lib/moves/moveLabels";
import {
  hitBreakdownDefines,
  STRENGTH_RANGE_BY_ATTACK_TYPE,
} from "@/lib/moves/moveRules";
import type { MoveInput } from "./moveObject";

/**
 * 属性（攻撃／ブロック／つかみ）・攻撃属性と、それに紐づく項目
 * （強度・判定・共鳴怯ませ強度）の整合性検証。
 */

/** 属性・攻撃属性を持たない技が、持てないはずの項目を持っていないか。 */
const validateNonAttackFields = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  if (move.strength !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["strength"],
      message: "攻撃属性を持たない技に強度は設定できません",
    });
  }
  if (move.guardLevel !== null) {
    ctx.addIssue({
      code: "custom",
      path: ["guardLevel"],
      message: "攻撃属性を持たない技に判定は設定できません",
    });
  }
  if (hitBreakdownDefines(move.hitBreakdown, "guardLevel")) {
    ctx.addIssue({
      code: "custom",
      path: ["hitBreakdown"],
      message: "攻撃属性を持たない技のヒット内訳に判定は設定できません",
    });
  }
  if (move.resonanceFlinch !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["resonanceFlinch"],
      message: "攻撃属性を持たない技に共鳴怯ませ強度は設定できません",
    });
  }
};

/** 攻撃属性を持つ技の強度が、属性ごとの範囲に収まっているか（条件付き差分も含む）。 */
const validateStrengthRange = (
  move: MoveInput,
  attackType: NonNullable<MoveInput["attackType"]>,
  ctx: z.RefinementCtx,
): void => {
  const range = STRENGTH_RANGE_BY_ATTACK_TYPE[attackType];
  const attackTypeLabel = ATTACK_TYPE_META[attackType].label;
  if (move.strength === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["strength"],
      message: `${attackTypeLabel}技は強度（${range.min}〜${range.max}）が必須です`,
    });
  } else if (move.strength < range.min || move.strength > range.max) {
    ctx.addIssue({
      code: "custom",
      path: ["strength"],
      message: `${attackTypeLabel}技の強度は${range.min}〜${range.max}で入力してください`,
    });
  }
  const overrides: {
    path: (string | number)[];
    value: number | undefined;
    label: string;
  }[] = [
    { path: ["resonance", "strength"], value: move.resonance?.strength, label: "共鳴中の強度" },
    { path: ["justInput", "strength"], value: move.justInput?.strength, label: "ジャスト入力時の強度" },
    {
      path: ["justInput", "resonance", "strength"],
      value: move.justInput?.resonance?.strength,
      label: "共鳴中のジャスト入力時の強度",
    },
    {
      path: ["fieldPhase", "strength"],
      value: move.fieldPhase?.strength,
      label: "フィールドフェイズの強度",
    },
  ];
  for (const override of overrides) {
    if (
      override.value !== undefined &&
      (override.value < range.min || override.value > range.max)
    ) {
      ctx.addIssue({
        code: "custom",
        path: override.path,
        message: `${override.label}は${range.min}〜${range.max}で入力してください`,
      });
    }
  }
};

/** 属性・攻撃属性と、それに紐づく項目（強度・判定・共鳴怯ませ）の相関。 */
export const validateAttackFields = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  if (move.category === undefined && move.attackType !== undefined) {
    // 属性を持たない技は攻撃しないため攻撃属性も持たない。
    ctx.addIssue({
      code: "custom",
      path: ["attackType"],
      message: "属性を持たない技に攻撃属性は設定できません",
    });
  }
  if (move.attackType === undefined) {
    validateNonAttackFields(move, ctx);
    return;
  }
  validateStrengthRange(move, move.attackType, ctx);
};
