import { useState } from "react";
import type { Character } from "@/types/character";
import type { Move, MoveVariant, Phase } from "@/types/move";
import { createMove } from "@/lib/factory";
import { getMovesByPhase, withMovesByPhase } from "@/lib/moves/phaseMoves";
import {
  flattenGroups,
  groupMovesByParent,
  reorderChildrenInGroup,
  reorderParentGroups,
} from "@/lib/moves/grouping";

const replaceById = (moves: Move[], moveId: string, move: Move): Move[] =>
  moves.map((entry) => (entry.id === moveId ? move : entry));

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
  /**
   * id で技を置き換える。setCharacter にしか依存しないため React Compiler 下で参照が
   * 安定し、子技エディタへ渡すコールバックを作り直さずに済む。
   */
  updateMove: (phase: Phase, moveId: string, move: Move) => void;
  /** 追加した親技の id を返す（呼び出し側が直後に選択できるようにするため）。 */
  addParentMove: (phase: Phase) => string;
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
  // 編集対象のキャラが変わったときのリセットは、呼び出し元が key を付け替えて
  // React に再マウントさせることで行う（effect で props を state へ同期しない）。
  const [character, setCharacter] = useState<Character>(initial);

  const replaceCharacter = (next: Character): void => {
    setCharacter(next);
  };

  const setCharacterName = (name: string): void => {
    setCharacter((current) => ({ ...current, name }));
  };

  const updateMove = (phase: Phase, moveId: string, move: Move): void => {
    setCharacter((current) =>
      withMovesByPhase(
        current,
        phase,
        replaceById(getMovesByPhase(current, phase), moveId, move),
      ),
    );
  };

  const addParentMove = (phase: Phase): string => {
    // id は character.id 由来（変更不可）なので closure 経由で生成して差し支えない
    const created = createMove(character.id, phase);
    setCharacter((current) =>
      withMovesByPhase(current, phase, [
        ...getMovesByPhase(current, phase),
        created,
      ]),
    );
    return created.id;
  };

  const addChildMove = (
    phase: Phase,
    parentMoveId: string,
    variant: Exclude<MoveVariant, "normal">,
  ): void => {
    setCharacter((current) => {
      const moves = getMovesByPhase(current, phase);
      const groups = groupMovesByParent(moves);
      const target = groups.find((group) => group.parent.id === parentMoveId);
      if (target === undefined) {
        return current;
      }
      const child = createMove(current.id, phase, { variant, parentMoveId });
      target.children = [...target.children, child];
      return withMovesByPhase(current, phase, flattenGroups(groups));
    });
  };

  const removeParentGroup = (phase: Phase, parentMoveId: string): void => {
    setCharacter((current) =>
      withMovesByPhase(
        current,
        phase,
        removeGroupByParentId(getMovesByPhase(current, phase), parentMoveId),
      ),
    );
  };

  const removeChildMove = (
    phase: Phase,
    parentMoveId: string,
    childMoveId: string,
  ): void => {
    setCharacter((current) =>
      withMovesByPhase(
        current,
        phase,
        removeChildById(
          getMovesByPhase(current, phase),
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
      withMovesByPhase(
        current,
        phase,
        reorderParentGroups(
          getMovesByPhase(current, phase),
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
      withMovesByPhase(
        current,
        phase,
        reorderChildrenInGroup(
          getMovesByPhase(current, phase),
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
    getPhaseMoves: (phase) => getMovesByPhase(character, phase),
  };
};
