import type { Move, Phase } from "./move";

export interface Character {
  id: string;
  name: string;
  fieldMoves: Move[];
  duelMoves: Move[];
  commonMoves: Move[];
}

export const PHASE_MOVES_KEYS = {
  field: "fieldMoves",
  duel: "duelMoves",
  common: "commonMoves",
} as const satisfies Record<Phase, keyof Character>;

export type PhaseMovesKey = (typeof PHASE_MOVES_KEYS)[Phase];
