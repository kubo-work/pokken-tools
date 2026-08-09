import { PHASE_MOVES_KEYS, type Character } from "@/types/character";
import type { Move, Phase } from "@/types/move";

export const getMovesByPhase = (character: Character, phase: Phase): Move[] =>
  character[PHASE_MOVES_KEYS[phase]];

export const withMovesByPhase = (
  character: Character,
  phase: Phase,
  moves: Move[],
): Character => ({ ...character, [PHASE_MOVES_KEYS[phase]]: moves });
