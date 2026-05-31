"use client";

import { useEffect, useState } from "react";
import type { Character } from "@/types/character";
import type { Move, MoveVariant, Phase } from "@/types/move";
import { createMove } from "@/lib/factory";
import {
  flattenGroups,
  groupMovesByParent,
  reorderChildrenInGroup,
  reorderParentGroups,
} from "@/lib/moves/grouping";

const getPhaseMoves = (character: Character, phase: Phase): Move[] =>
  phase === "field" ? character.fieldMoves : character.duelMoves;

const withPhaseMoves = (
  character: Character,
  phase: Phase,
  moves: Move[],
): Character =>
  phase === "field"
    ? { ...character, fieldMoves: moves }
    : { ...character, duelMoves: moves };

const replaceAt = (moves: Move[], index: number, move: Move): Move[] =>
  moves.map((entry, position) => (position === index ? move : entry));

const removeGroupByParentId = (moves: Move[], parentId: string): Move[] => {
  const groups = groupMovesByParent(moves);
  return flattenGroups(groups.filter((group) => group.parent.id !== parentId));
};

const removeChildById = (
  moves: Move[],
  parentId: string,
  childId: string,
): Move[] => {
  const groups = groupMovesByParent(moves);
  for (const group of groups) {
    if (group.parent.id !== parentId) {
      continue;
    }
    group.children = group.children.filter((child) => child.id !== childId);
  }
  return flattenGroups(groups);
};

export interface UseCharacterStateResult {
  character: Character;
  /** import JSON など、Character 丸ごと差し替える用途。 */
  replaceCharacter: (next: Character) => void;
  setCharacterName: (name: string) => void;
  updateMove: (phase: Phase, index: number, move: Move) => void;
  addParentMove: (phase: Phase) => void;
  addChildMove: (
    phase: Phase,
    parentMoveId: string,
    variant: Exclude<MoveVariant, "normal">,
  ) => void;
  removeParentGroup: (phase: Phase, parentMoveId: string) => void;
  removeChildMove: (
    phase: Phase,
    parentMoveId: string,
    childMoveId: string,
  ) => void;
  reorderParents: (
    phase: Phase,
    fromGroupIndex: number,
    toGroupIndex: number,
  ) => void;
  reorderChildren: (
    phase: Phase,
    parentMoveId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  getPhaseMoves: (phase: Phase) => Move[];
}

/**
 * Character 編集の純粋な state 操作だけを担う hook。
 * I/O や API 呼び出しは含めず、UI から呼び出される編集アクションを返す。
 */
export const useCharacterState = (
  initial: Character,
): UseCharacterStateResult => {
  const [character, setCharacter] = useState<Character>(initial);

  // 外部から initial が差し替わったらリセット（編集中の入力は破棄される）
  useEffect(() => {
    setCharacter(initial);
  }, [initial]);

  const replaceCharacter = (next: Character): void => {
    setCharacter(next);
  };

  const setCharacterName = (name: string): void => {
    setCharacter((current) => ({ ...current, name }));
  };

  const updateMove = (phase: Phase, index: number, move: Move): void => {
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        replaceAt(getPhaseMoves(current, phase), index, move),
      ),
    );
  };

  const addParentMove = (phase: Phase): void => {
    setCharacter((current) =>
      withPhaseMoves(current, phase, [
        ...getPhaseMoves(current, phase),
        createMove(current.id, phase),
      ]),
    );
  };

  const addChildMove = (
    phase: Phase,
    parentMoveId: string,
    variant: Exclude<MoveVariant, "normal">,
  ): void => {
    setCharacter((current) => {
      const moves = getPhaseMoves(current, phase);
      const groups = groupMovesByParent(moves);
      const target = groups.find((group) => group.parent.id === parentMoveId);
      if (target === undefined) {
        return current;
      }
      const child = createMove(current.id, phase, { variant, parentMoveId });
      target.children = [...target.children, child];
      return withPhaseMoves(current, phase, flattenGroups(groups));
    });
  };

  const removeParentGroup = (phase: Phase, parentMoveId: string): void => {
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        removeGroupByParentId(getPhaseMoves(current, phase), parentMoveId),
      ),
    );
  };

  const removeChildMove = (
    phase: Phase,
    parentMoveId: string,
    childMoveId: string,
  ): void => {
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        removeChildById(
          getPhaseMoves(current, phase),
          parentMoveId,
          childMoveId,
        ),
      ),
    );
  };

  const reorderParents = (
    phase: Phase,
    fromGroupIndex: number,
    toGroupIndex: number,
  ): void => {
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        reorderParentGroups(
          getPhaseMoves(current, phase),
          fromGroupIndex,
          toGroupIndex,
        ),
      ),
    );
  };

  const reorderChildren = (
    phase: Phase,
    parentMoveId: string,
    fromIndex: number,
    toIndex: number,
  ): void => {
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        reorderChildrenInGroup(
          getPhaseMoves(current, phase),
          parentMoveId,
          fromIndex,
          toIndex,
        ),
      ),
    );
  };

  return {
    character,
    replaceCharacter,
    setCharacterName,
    updateMove,
    addParentMove,
    addChildMove,
    removeParentGroup,
    removeChildMove,
    reorderParents,
    reorderChildren,
    getPhaseMoves: (phase) => getPhaseMoves(character, phase),
  };
};
