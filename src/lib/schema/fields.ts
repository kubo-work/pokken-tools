import { z } from "zod";

/**
 * Move を構成する個々のフィールドのスキーマ。
 * 「その値単体として妥当か」だけを定義し、フィールド同士の整合性（強度と攻撃属性の相関、
 * ヒット内訳と単一値の相互排他など）は組み立て側 (schema/index.ts) の検証に委ねる。
 */

export const guardLevelSchema = z.enum([
  "high",
  "mid_high",
  "mid",
  "special_mid",
  "mid_low",
  "low",
]);
export const categorySchema = z.enum(["attack", "block", "grab"]);
export const attackTypeSchema = z.enum(["strike", "projectile"]);
export const strengthSchema = z.number().int().positive();
export const resonanceFlinchSchema = z.union([
  z.enum(["weak", "strong"]),
  z.object({ switchActiveFrame: z.number().int().positive() }),
]);
export const specialAttributeSchema = z.enum([
  "blockPiercing",
  "armor",
  "projectileNullify",
]);
export const airGroundJudgmentSchema = z.enum(["air", "ground"]);
export const variantSchema = z.enum(["normal", "charge", "derivative"]);

const frameAdvantageRangeSchema = z
  .object({ min: z.number(), max: z.number() })
  .refine((range) => range.min <= range.max, {
    message: "範囲は 最小（不利側）<= 最大（有利側）で入力してください",
  });
export const guardFrameAdvantageSchema = z.union([
  z.number(),
  frameAdvantageRangeSchema,
]);
export const hitFrameAdvantageSchema = z.union([
  z.number(),
  frameAdvantageRangeSchema,
  z.literal("down"),
]);

export const damageValueSchema = z.union([
  z.number().int().nonnegative(),
  z.object({
    perHit: z.number().int().positive(),
    hitCount: z.number().int().min(2, "多段表記のヒット数は2以上です"),
  }),
]);

const hitBreakdownEntrySchema = z
  .object({
    hitCount: z.number().int().min(1),
    baseDamage: z.number().int().nonnegative().optional(),
    chipDamage: z.number().int().nonnegative().optional(),
    guardCrushValue: z.number().int().nonnegative().optional(),
    guardLevel: guardLevelSchema.optional(),
    airGroundJudgment: airGroundJudgmentSchema.optional(),
  })
  .refine(
    (entry) =>
      entry.baseDamage !== undefined ||
      entry.chipDamage !== undefined ||
      entry.guardCrushValue !== undefined ||
      entry.guardLevel !== undefined ||
      entry.airGroundJudgment !== undefined,
    { message: "ヒット数以外に最低1項目は設定してください" },
  );
export const hitBreakdownSchema = z
  .array(hitBreakdownEntrySchema)
  .min(1, "ヒットごとの内訳は1グループ以上で入力してください");

/** 共鳴・ジャスト入力に共通する、条件付きの性能上書き。 */
export const moveOverrideSchema = z.object({
  startup: z.number().optional(),
  activeUntilFrame: z.number().int().positive().optional(),
  guardFrameAdvantage: z.number().optional(),
  guardFrameAdvantageOnPokemonMoveCancel: z.number().optional(),
  hitFrameAdvantage: z.number().optional(),
  hitFrameAdvantageOnPokemonMoveCancel: z.number().optional(),
  strength: strengthSchema.optional(),
  guardLevel: guardLevelSchema.optional(),
  baseDamage: damageValueSchema.optional(),
  chipDamage: damageValueSchema.optional(),
  guardCrushValue: damageValueSchema.optional(),
  phaseChangePoints: z.number().int().nonnegative().optional(),
  hitBreakdown: hitBreakdownSchema.optional(),
});

const acceptFramesSchema = z
  .object({
    start: z.number().int().positive(),
    end: z.number().int().positive(),
  })
  .refine((range) => range.start <= range.end, {
    message: "受付フレームは開始 <= 終了で入力してください",
  });

/** ジャスト入力の上書き。受付フレームと、共鳴中だけ別値になる場合の入れ子差分を持つ。 */
export const justInputOverrideSchema = moveOverrideSchema.extend({
  acceptFrames: acceptFramesSchema.optional(),
  resonance: moveOverrideSchema.optional(),
});
