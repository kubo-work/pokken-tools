import { z } from "zod";

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
const strengthSchema = z.enum(["weak", "medium", "strong"]);
const specialAttributeSchema = z.enum(["blockPiercing", "armor"]);
const variantSchema = z.enum(["normal", "charge", "derivative"]);

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
    category: categorySchema,
    attackType: attackTypeSchema.optional(),
    guardLevel: guardLevelSchema.nullable(),
    startup: z.number(),
    guardFrameAdvantage: z.number(),
    hitFrameAdvantage: z.number().optional(),
    strength: strengthSchema,
    specialAttributes: z.array(specialAttributeSchema).optional(),
    variant: variantSchema.optional(),
    parentMoveId: z.string().min(1).optional(),
    resonance: resonanceOverrideSchema.optional(),
    resonanceOnly: z.boolean().optional(),
    note: z.string().optional(),
    description: z.string().optional(),
  })
  .superRefine((move, ctx) => {
    if (
      (move.category === "attack" || move.category === "block") &&
      move.attackType === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["attackType"],
        message: "攻撃・ブロック技は攻撃属性（打撃／弾）が必須です",
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
