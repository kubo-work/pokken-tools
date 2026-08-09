import { z } from "zod";
import { PHASES } from "@/lib/moves/moveEnums";
import { getMovesByPhase } from "@/lib/moves/phaseMoves";
import { PHASE_MOVES_KEYS } from "@/types/character";
import { moveObjectSchema } from "./moveObject";
import { validateMove } from "./moveRefinements";

/** 技のスキーマ。形（moveObject）＋フィールド同士の整合性（moveRefinements）。 */
export const moveSchema = moveObjectSchema.superRefine(validateMove);

export const characterSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_]+$/, "ID は英小文字・数字・_ のみ"),
    name: z.string().min(1),
    fieldMoves: z.array(moveSchema),
    duelMoves: z.array(moveSchema),
    commonMoves: z.array(moveSchema).default([]),
  })
  .superRefine((character, ctx) => {
    for (const phase of PHASES) {
      const key = PHASE_MOVES_KEYS[phase];
      const moves = getMovesByPhase(character, phase);
      const idSet = new Set(moves.map((move) => move.id));
      moves.forEach((move, index) => {
        if (move.fieldPhase !== undefined && phase !== "common") {
          ctx.addIssue({
            code: "custom",
            path: [key, index, "fieldPhase"],
            message:
              "fieldPhase（フィールドフェイズでの上書き）は共通技（commonMoves）にのみ設定できます",
          });
        }
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
