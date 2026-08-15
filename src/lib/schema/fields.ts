import { z } from "zod";
import {
  hitBreakdownEntryHasAnyValue,
  MULTI_HIT_MIN_COUNT,
} from "@/lib/moves/moveRules";

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
export const strengthSymbolSchema = z.enum(["erase", "inert"]);
/**
 * 強度の値単体の形。数値か記号かだけを見る。
 * 「記号は弾だけ」「数値は属性ごとの範囲内」といったフィールド同士の相関は
 * schema/attackRefinements が担う（このファイルは値単体の妥当性だけを持つ）。
 */
export const strengthSchema = z.union(
  [z.number().int().positive(), strengthSymbolSchema],
  { error: "強度は数値か ◎・● で入力してください" },
);
export const resonanceFlinchLevelSchema = z.enum(["weak", "strong"]);
export const resonanceFlinchSchema = z.union([
  resonanceFlinchLevelSchema,
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
  .object({ min: z.number().optional(), max: z.number().optional() })
  .refine((range) => range.min !== undefined || range.max !== undefined, {
    message: "範囲は最小・最大の少なくとも片方を入力してください",
  })
  .refine(
    (range) =>
      range.min === undefined || range.max === undefined || range.min <= range.max,
    { message: "範囲は 最小（不利側）<= 最大（有利側）で入力してください" },
  );
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
    hitCount: z
      .number()
      .int()
      .min(
        MULTI_HIT_MIN_COUNT,
        `多段表記のヒット数は${MULTI_HIT_MIN_COUNT}以上です`,
      ),
  }),
]);

/**
 * PCH値の区切り1つ。hitCount は1以上（ダメージ系の多段表記と違い、1ヒットの区切りも
 * 意味を持つため MULTI_HIT_MIN_COUNT を使わない）。
 */
export const phaseChangePointsSegmentSchema = z.object({
  perHit: z.number().nonnegative(),
  hitCount: z.number().int().min(1),
});

/**
 * PCH値。単発・全ヒット一定なら小数を許す単一の数値、ヒットごとに PCH が変わる技は
 * 区切りの配列（例: 5×1 + 3.5×4）。damageValueSchema と違い、1ヒットの区切りも許可し、
 * 値そのものに整数制約が無い。
 */
export const phaseChangePointsValueSchema = z.union([
  z.number().nonnegative(),
  z.array(phaseChangePointsSegmentSchema).min(1),
]);

/**
 * 合計ダメージ。実測値なので 0 は取らない（当たれば必ずダメージが入る）。
 * 技単位・各上書き層で同じ制約のため 1 つに集約する。
 */
export const totalDamageSchema = z.number().int().positive();

const hitBreakdownEntrySchema = z
  .object({
    hitCount: z.number().int().min(1),
    baseDamage: z.number().int().nonnegative().optional(),
    chipDamage: z.number().int().nonnegative().optional(),
    guardCrushValue: z.number().int().nonnegative().optional(),
    phaseChangePoints: z.number().nonnegative().optional(),
    guardLevel: guardLevelSchema.optional(),
    airGroundJudgment: airGroundJudgmentSchema.optional(),
    resonanceFlinch: resonanceFlinchLevelSchema.optional(),
    attackType: attackTypeSchema.optional(),
    strength: strengthSchema.optional(),
  })
  // 判定ロジックは moveRules.hitBreakdownEntryHasAnyValue に集約する
  // （管理画面側の警告表示 HitBreakdownFields.tsx と同じ判断を共有するため）。
  .refine(hitBreakdownEntryHasAnyValue, {
    message: "ヒット数以外に最低1項目は設定してください",
  });
export const hitBreakdownSchema = z
  .array(hitBreakdownEntrySchema)
  .min(1, "ヒットごとの内訳は1グループ以上で入力してください");

/** 条件（共鳴・ジャスト入力・フェイズ差）によらず共通して変わりうる性能値。 */
const moveOverrideBaseSchema = z.object({
  startup: z.number().optional(),
  activeUntilFrame: z.number().int().positive().optional(),
  guardFrameAdvantage: z.number().optional(),
  guardFrameAdvantageOnPokemonMoveCancel: z.number().optional(),
  hitFrameAdvantage: z.number().optional(),
  hitFrameAdvantageOnPokemonMoveCancel: z.number().optional(),
  strength: strengthSchema.optional(),
  baseDamage: damageValueSchema.optional(),
  totalDamage: totalDamageSchema.optional(),
  chipDamage: damageValueSchema.optional(),
  guardCrushValue: damageValueSchema.optional(),
  phaseChangePoints: phaseChangePointsValueSchema.optional(),
  hitBreakdown: hitBreakdownSchema.optional(),
});

/** 共鳴・ジャスト入力に共通する、条件付きの性能上書き。 */
export const moveOverrideSchema = moveOverrideBaseSchema.extend({
  guardLevel: guardLevelSchema.optional(),
});

/**
 * フィールドフェイズでの上書き。フェイズでは入力そのものが変わる技があるため command を持ち、
 * 逆にフェイズでは変わらない判定 (guardLevel) は持たない（types/move.ts の FieldPhaseOverride 参照）。
 */
export const fieldPhaseOverrideSchema = moveOverrideBaseSchema.extend({
  command: z.string().optional(),
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
