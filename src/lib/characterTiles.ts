import type { Character } from "@/types/character";
import { CHARACTER_REGISTRY } from "@/lib/characters/registry";

/** キャラ選択タイル1件分。登録済み技数（FP/DP）を添える。 */
export interface CharacterTile {
  id: string;
  name: string;
  field: number;
  duel: number;
}

/**
 * registry の順序を保ったキャラタイル配列を作る。
 * KV 未投入のキャラは 0/0 で埋める。公開トップと admin トップで共通利用する。
 */
export const buildCharacterTiles = (
  characters: Character[],
): CharacterTile[] => {
  const countsById = new Map(
    characters.map((character) => [
      character.id,
      { field: character.fieldMoves.length, duel: character.duelMoves.length },
    ]),
  );
  return CHARACTER_REGISTRY.map((entry) => {
    const counts = countsById.get(entry.id) ?? { field: 0, duel: 0 };
    return { id: entry.id, name: entry.name, ...counts };
  });
};
