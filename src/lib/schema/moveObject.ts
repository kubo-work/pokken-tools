import { z } from "zod";
import {
  airGroundJudgmentSchema,
  attackTypeSchema,
  categorySchema,
  damageValueSchema,
  guardFrameAdvantageSchema,
  guardLevelSchema,
  hitBreakdownSchema,
  hitFrameAdvantageSchema,
  justInputOverrideSchema,
  moveOverrideSchema,
  resonanceFlinchSchema,
  specialAttributeSchema,
  strengthSchema,
  variantSchema,
} from "./fields";

/**
 * 技の形（どのフィールドを持ち、それぞれ単体としてどんな値を許すか）。
 * フィールド同士の整合性は moveRefinements の検証に委ね、ここでは形だけを定義する。
 */
export const moveObjectSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  command: z.string(),
  category: categorySchema.optional(),
  attackType: attackTypeSchema.optional(),
  guardLevel: guardLevelSchema.nullable(),
  startup: z.number(),
  guardFrameAdvantage: guardFrameAdvantageSchema,
  guardFrameAdvantageOnPokemonMoveCancel: z.number().optional(),
  hitFrameAdvantage: hitFrameAdvantageSchema.optional(),
  hitFrameAdvantageOnPokemonMoveCancel: z.number().optional(),
  strength: strengthSchema.optional(),
  resonanceFlinch: resonanceFlinchSchema.optional(),
  specialAttributes: z.array(specialAttributeSchema).optional(),
  projectileNullifyStartFrame: z.number().int().positive().optional(),
  airGroundJudgment: airGroundJudgmentSchema.optional(),
  variant: variantSchema.optional(),
  parentMoveId: z.string().min(1).optional(),
  chargeLevel: z.number().int().positive().optional(),
  guardInterruptFrames: z.number().int().nonnegative().optional(),
  resonance: moveOverrideSchema.optional(),
  justInput: justInputOverrideSchema.optional(),
  resonanceOnly: z.boolean().optional(),
  baseDamage: damageValueSchema.optional(),
  chipDamage: damageValueSchema.optional(),
  guardCrushValue: damageValueSchema.optional(),
  phaseChangePoints: z.number().int().nonnegative().optional(),
  hitBreakdown: hitBreakdownSchema.optional(),
  note: z.string().optional(),
  description: z.string().optional(),
});

/** 形の検証だけを通した技。検証関数はこの型を受け取る。 */
export type MoveInput = z.infer<typeof moveObjectSchema>;
