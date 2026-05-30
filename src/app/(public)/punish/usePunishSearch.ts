"use client";

import { useMemo, useState } from "react";
import type { Character } from "@/types/character";
import type {
  Move,
  Phase,
  PunishException,
  ResonanceState,
} from "@/types/move";
import { PHASES, PHASE_META } from "@/lib/meta";
import { searchPunishes, type PunishResult } from "@/lib/frame/calcPunish";

export interface MoveOption {
  value: string;
  label: string;
  characterId: string;
  phase: Phase;
}

export interface AttackerContext {
  character: Character;
  phase: Phase;
  move: Move;
}

const buildMoveOptions = (characters: Character[]): MoveOption[] => {
  const options: MoveOption[] = [];
  for (const character of characters) {
    for (const phase of PHASES) {
      const moves =
        phase === "field" ? character.fieldMoves : character.duelMoves;
      for (const move of moves) {
        options.push({
          value: move.id,
          label: `${character.name} / ${move.name}（${move.command}）[${PHASE_META[phase].shortLabel}]`,
          characterId: character.id,
          phase,
        });
      }
    }
  }
  return options;
};

const findMoveById = (
  characters: Character[],
  moveId: string,
): AttackerContext | undefined => {
  for (const character of characters) {
    for (const phase of PHASES) {
      const moves =
        phase === "field" ? character.fieldMoves : character.duelMoves;
      const move = moves.find((entry) => entry.id === moveId);
      if (move !== undefined) {
        return { character, phase, move };
      }
    }
  }
  return undefined;
};

export interface UsePunishSearchParams {
  characters: Character[];
  exceptions: PunishException[];
  fixedDefenderCharacterId?: string;
}

export interface UsePunishSearchResult {
  allMoveOptions: MoveOption[];
  attackerMoveId: string;
  setAttackerMoveId: (id: string) => void;
  defenderCharacterId: string;
  setDefenderCharacterId: (id: string) => void;
  defenderState: ResonanceState;
  setDefenderState: (state: ResonanceState) => void;
  attackerContext: AttackerContext | undefined;
  defender: Character | undefined;
  results: PunishResult[];
  isDefenderFixed: boolean;
}

export const usePunishSearch = ({
  characters,
  exceptions,
  fixedDefenderCharacterId,
}: UsePunishSearchParams): UsePunishSearchResult => {
  const allMoveOptions = useMemo(
    () => buildMoveOptions(characters),
    [characters],
  );

  const fixedDefender = useMemo(
    () =>
      fixedDefenderCharacterId === undefined
        ? undefined
        : characters.find((c) => c.id === fixedDefenderCharacterId),
    [characters, fixedDefenderCharacterId],
  );

  const [attackerMoveId, setAttackerMoveId] = useState<string>(
    allMoveOptions[0]?.value ?? "",
  );
  const [defenderCharacterId, setDefenderCharacterId] = useState<string>(
    fixedDefenderCharacterId ?? characters[0]?.id ?? "",
  );
  const [defenderState, setDefenderState] = useState<ResonanceState>("normal");

  const attackerContext = useMemo(
    () => findMoveById(characters, attackerMoveId),
    [characters, attackerMoveId],
  );

  const defender =
    fixedDefender ?? characters.find((c) => c.id === defenderCharacterId);

  const results = useMemo<PunishResult[]>(() => {
    if (attackerContext === undefined || defender === undefined) {
      return [];
    }
    return searchPunishes({
      attackerMove: attackerContext.move,
      defenderMoves: [...defender.duelMoves, ...defender.fieldMoves],
      defenderState,
      exceptions,
    });
  }, [attackerContext, defender, defenderState, exceptions]);

  return {
    allMoveOptions,
    attackerMoveId,
    setAttackerMoveId,
    defenderCharacterId,
    setDefenderCharacterId,
    defenderState,
    setDefenderState,
    attackerContext,
    defender,
    results,
    isDefenderFixed: fixedDefenderCharacterId !== undefined,
  };
};
