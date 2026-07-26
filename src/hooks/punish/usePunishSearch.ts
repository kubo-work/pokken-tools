import { useState } from "react";
import type { Character } from "@/types/character";
import type {
  Move,
  Phase,
  PunishException,
  ResonanceState,
} from "@/types/move";
import { MOVE_VARIANT_META, PHASES, PHASE_META } from "@/lib/meta";
import { formatMoveCommand } from "@/lib/moves/command";
import { isChildMove } from "@/lib/moves/grouping";
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

const buildLabel = (
  characterName: string,
  move: Move,
  parent: Move | undefined,
  phaseShort: string,
): string => {
  const variantTag = isChildMove(move)
    ? `［${MOVE_VARIANT_META[move.variant].label}］`
    : "";
  const command = formatMoveCommand(move, parent?.command);
  return `${characterName} / ${move.name}${variantTag}（${command}）[${phaseShort}]`;
};

const buildMoveOptions = (characters: Character[]): MoveOption[] => {
  const options: MoveOption[] = [];
  for (const character of characters) {
    for (const phase of PHASES) {
      const moves =
        phase === "field" ? character.fieldMoves : character.duelMoves;
      const movesById = new Map(moves.map((entry) => [entry.id, entry]));
      for (const move of moves) {
        const parent =
          move.parentMoveId !== undefined
            ? movesById.get(move.parentMoveId)
            : undefined;
        options.push({
          value: move.id,
          label: buildLabel(
            character.name,
            move,
            parent,
            PHASE_META[phase].shortLabel,
          ),
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
  // 以下の派生値の再計算抑止は React Compiler の自動メモ化に任せる（手動 useMemo は不要）。
  const allMoveOptions = buildMoveOptions(characters);

  const fixedDefender =
    fixedDefenderCharacterId === undefined
      ? undefined
      : characters.find((c) => c.id === fixedDefenderCharacterId);

  const [attackerMoveId, setAttackerMoveId] = useState<string>(
    allMoveOptions[0]?.value ?? "",
  );
  const [defenderCharacterId, setDefenderCharacterId] = useState<string>(
    fixedDefenderCharacterId ?? characters[0]?.id ?? "",
  );
  const [defenderState, setDefenderState] = useState<ResonanceState>("normal");

  const attackerContext = findMoveById(characters, attackerMoveId);

  const defender =
    fixedDefender ?? characters.find((c) => c.id === defenderCharacterId);

  const results: PunishResult[] =
    attackerContext === undefined || defender === undefined
      ? []
      : searchPunishes({
          attackerMove: attackerContext.move,
          defenderMoves: [...defender.duelMoves, ...defender.fieldMoves],
          defenderState,
          exceptions,
        });

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
