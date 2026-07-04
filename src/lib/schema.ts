import { z } from "zod";
import { ATTACK_TYPE_META, STRENGTH_RANGE_BY_ATTACK_TYPE } from "@/lib/meta";

const guardLevelSchema = z.enum([
  "high",
  "mid_high",
  "mid",
  "special_mid",
  "mid_low",
  "low",
]);
const categorySchema = z.enum(["attack", "block", "grab"]);
const attackTypeSchema = z.enum(["strike", "projectile"]);
const strengthSchema = z.number().int().positive();
const resonanceFlinchSchema = z.union([
  z.enum(["weak", "strong"]),
  z.object({ switchActiveFrame: z.number().int().positive() }),
]);
const specialAttributeSchema = z.enum([
  "blockPiercing",
  "armor",
  "projectileNullify",
]);
const airGroundJudgmentSchema = z.enum(["air", "ground"]);
const variantSchema = z.enum(["normal", "charge", "derivative"]);
const frameAdvantageRangeSchema = z
  .object({ min: z.number(), max: z.number() })
  .refine((range) => range.min <= range.max, {
    message: "範囲は 最小（不利側）<= 最大（有利側）で入力してください",
  });
const guardFrameAdvantageSchema = z.union([
  z.number(),
  frameAdvantageRangeSchema,
]);
const hitFrameAdvantageSchema = z.union([
  z.number(),
  frameAdvantageRangeSchema,
  z.literal("down"),
]);

const resonanceOverrideSchema = z.object({
  startup: z.number().optional(),
  guardFrameAdvantage: z.number().optional(),
  hitFrameAdvantage: z.number().optional(),
  strength: strengthSchema.optional(),
  guardLevel: guardLevelSchema.optional(),
});

export const moveSchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    command: z.string(),
    category: categorySchema.optional(),
    attackType: attackTypeSchema.optional(),
    guardLevel: guardLevelSchema.nullable(),
    startup: z.number(),
    guardFrameAdvantage: guardFrameAdvantageSchema,
    hitFrameAdvantage: hitFrameAdvantageSchema.optional(),
    strength: strengthSchema.optional(),
    resonanceFlinch: resonanceFlinchSchema.optional(),
    specialAttributes: z.array(specialAttributeSchema).optional(),
    projectileNullifyStartFrame: z.number().int().positive().optional(),
    airGroundJudgment: airGroundJudgmentSchema.optional(),
    variant: variantSchema.optional(),
    parentMoveId: z.string().min(1).optional(),
    chargeLevel: z.number().int().positive().optional(),
    resonance: resonanceOverrideSchema.optional(),
    resonanceOnly: z.boolean().optional(),
    note: z.string().optional(),
    description: z.string().optional(),
  })
  .superRefine((move, ctx) => {
    if (move.category === undefined && move.attackType !== undefined) {
      // 属性を持たない技は攻撃しないため攻撃属性も持たない。
      ctx.addIssue({
        code: "custom",
        path: ["attackType"],
        message: "属性を持たない技に攻撃属性は設定できません",
      });
    }
    if (move.attackType === undefined) {
      // 攻撃属性を持たない技（つかみ・攻撃しない技）は強度・判定・共鳴怯ませ強度を持たない。
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
      if (move.resonanceFlinch !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["resonanceFlinch"],
          message: "攻撃属性を持たない技に共鳴怯ませ強度は設定できません",
        });
      }
    } else {
      const range = STRENGTH_RANGE_BY_ATTACK_TYPE[move.attackType];
      const attackTypeLabel = ATTACK_TYPE_META[move.attackType].label;
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
      const resonanceStrength = move.resonance?.strength;
      if (
        resonanceStrength !== undefined &&
        (resonanceStrength < range.min || resonanceStrength > range.max)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["resonance", "strength"],
          message: `共鳴中の強度は${range.min}〜${range.max}で入力してください`,
        });
      }
    }
    if (
      move.projectileNullifyStartFrame !== undefined &&
      !(move.specialAttributes?.includes("projectileNullify") ?? false)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["projectileNullifyStartFrame"],
        message:
          "弾消し開始フレームは特殊属性「弾消し」を持つ技にのみ設定できます",
      });
    }
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
  });

export const characterSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_]+$/, "ID は英小文字・数字・_ のみ"),
    name: z.string().min(1),
    fieldMoves: z.array(moveSchema),
    duelMoves: z.array(moveSchema),
  })
  .superRefine((character, ctx) => {
    const phases = [
      { key: "fieldMoves" as const, moves: character.fieldMoves },
      { key: "duelMoves" as const, moves: character.duelMoves },
    ];
    for (const { key, moves } of phases) {
      const idSet = new Set(moves.map((move) => move.id));
      moves.forEach((move, index) => {
        if (move.parentMoveId === undefined) {
          return;
        }
        if (!idSet.has(move.parentMoveId)) {
          ctx.addIssue({
            code: "custom",
            path: [key, index, "parentMoveId"],
            message: `親技 ${move.parentMoveId} が同じフェーズ内に見つかりません`,
          });
        }
      });
    }
  });

export const punishExceptionSchema = z.object({
  attackerMoveId: z.string().min(1),
  defenderMoveId: z.string().min(1),
  action: z.enum(["exclude", "hit"]),
  guardFrameAdvantageOverride: z.number().optional(),
  note: z.string().optional(),
});

export const exceptionsSchema = z.array(punishExceptionSchema);

export const emailSchema = z
  .string()
  .email("メールアドレスの形式が正しくありません");
