import { z } from "zod";

const guardLevelSchema = z.enum(["high", "mid", "low"]);
const categorySchema = z.enum(["attack", "block", "grab"]);
const attackTypeSchema = z.enum(["strike", "projectile"]);
const strengthSchema = z.enum(["weak", "medium", "strong"]);
const specialAttributeSchema = z.enum(["blockPiercing", "armor"]);

const resonanceOverrideSchema = z.object({
  startup: z.number().optional(),
  recovery: z.number().optional(),
  strength: strengthSchema.optional(),
});

export const moveSchema = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    command: z.string(),
    category: categorySchema,
    attackType: attackTypeSchema.optional(),
    guardLevels: z.array(guardLevelSchema),
    startup: z.number(),
    recovery: z.number(),
    strength: strengthSchema,
    specialAttributes: z.array(specialAttributeSchema).optional(),
    resonance: resonanceOverrideSchema.optional(),
    resonanceOnly: z.boolean().optional(),
    note: z.string().optional(),
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
  });

export const characterSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/, "ID は英小文字・数字・_ のみ"),
  name: z.string().min(1),
  fieldMoves: z.array(moveSchema),
  duelMoves: z.array(moveSchema),
});

export const punishExceptionSchema = z.object({
  attackerMoveId: z.string().min(1),
  defenderMoveId: z.string().min(1),
  action: z.enum(["exclude", "hit"]),
  recoveryOverride: z.number().optional(),
  note: z.string().optional(),
});

export const exceptionsSchema = z.array(punishExceptionSchema);

export const emailSchema = z
  .string()
  .email("メールアドレスの形式が正しくありません");
