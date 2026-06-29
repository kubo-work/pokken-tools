import type { Character } from "@/types/character";
import type { Move, Phase } from "@/types/move";

/** 詳細ページが必要とする、技本体と表示文脈（親技・フェイズ）をまとめた結果。 */
export interface FoundMove {
  move: Move;
  /** ため/派生の場合の親技。通常技や親不明のときは undefined。 */
  parent: Move | undefined;
  phase: Phase;
}

const findInPhase = (
  moves: Move[],
  moveId: string,
): { move: Move; parent: Move | undefined } | undefined => {
  const move = moves.find((candidate) => candidate.id === moveId);
  if (move === undefined) {
    return undefined;
  }
  const parent =
    move.parentMoveId === undefined
      ? undefined
      : moves.find((candidate) => candidate.id === move.parentMoveId);
  return { move, parent };
};

/**
 * キャラの全技（デュエル → フィールドの順）から moveId に一致する技を探す。
 * 子技なら parentMoveId から親技も同フェイズ内で解決する。見つからなければ undefined。
 */
export const findMoveInCharacter = (
  character: Character,
  moveId: string,
): FoundMove | undefined => {
  const duel = findInPhase(character.duelMoves, moveId);
  if (duel !== undefined) {
    return { ...duel, phase: "duel" };
  }
  const field = findInPhase(character.fieldMoves, moveId);
  if (field !== undefined) {
    return { ...field, phase: "field" };
  }
  return undefined;
};
