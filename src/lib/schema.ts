import { z } from "zod";

const guardLevelSchema = z.enum(["high", "mid", "low"]);
const categorySchema = z.enum(["attack", "block", "grab"]);
const strengthSchema = z.enum(["weak", "medium", "strong"]);

const resonanceOverrideSchema = z.object({
  startup: z.number().optional(),
  active: z.number().optional(),
  blockAdvantage: z.number().optional(),
  hitAdvantage: z.number().optional(),
  damage: z.number().optional(),
  strength: strengthSchema.optional(),
});

export const moveSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  command: z.string(),
  category: categorySchema,
  guardLevels: z.array(guardLevelSchema),
  startup: z.number(),
  active: z.number(),
  blockAdvantage: z.number(),
  hitAdvantage: z.number(),
  damage: z.number(),
  strength: strengthSchema,
  resonance: resonanceOverrideSchema.optional(),
  resonanceOnly: z.boolean().optional(),
  note: z.string().optional(),
});

export const characterSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/, "ID は英小文字・数字・_ のみ"),
  name: z.string().min(1),
  title: z.string().optional(),
  fieldMoves: z.array(moveSchema),
  duelMoves: z.array(moveSchema),
});

export const punishExceptionSchema = z.object({
  attackerMoveId: z.string().min(1),
  defenderMoveId: z.string().min(1),
  action: z.enum(["exclude", "hit"]),
  note: z.string().optional(),
});

export const exceptionsSchema = z.array(punishExceptionSchema);

export const emailSchema = z
  .string()
  .email("メールアドレスの形式が正しくありません");
