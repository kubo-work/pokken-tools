import type { Character } from "@/types/character";
import { getEnv } from "@/lib/cloudflare";
import { CHARACTER_REGISTRY, getRegistryEntry } from "@/lib/characters/registry";
import { KV_KEYS } from "./keys";

/**
 * 単一キャラを取得。
 * KV に未投入でも registry に存在するキャラなら空配列の Character を返し、
 * registry にも無い ID のときだけ undefined を返す。
 * これにより「KV seed 前でも公開ページが描画される」「全キャラ等価に扱える」を両立する。
 */
export async function getCharacter(id: string): Promise<Character | undefined> {
  const entry = getRegistryEntry(id);
  if (entry === undefined) {
    return undefined;
  }
  const env = await getEnv();
  const stored = await env.FRAME_DATA_KV.get<Character>(KV_KEYS.character(id), "json");
  if (stored !== null) {
    return stored;
  }
  return {
    id: entry.id,
    name: entry.name,
    fieldMoves: [],
    duelMoves: [],
  };
}

/**
 * 全キャラを並列取得。registry の順序を保持する。
 * KV に未投入のキャラは registry の名前で空配列を埋める fallback を出す。
 */
export async function getAllCharacters(): Promise<Character[]> {
  const env = await getEnv();
  const results = await Promise.all(
    CHARACTER_REGISTRY.map(async (entry) => {
      const character = await env.FRAME_DATA_KV.get<Character>(
        KV_KEYS.character(entry.id),
        "json",
      );
      if (character !== null) {
        return character;
      }
      const fallback: Character = {
        id: entry.id,
        name: entry.name,
        fieldMoves: [],
        duelMoves: [],
      };
      return fallback;
    }),
  );
  return results;
}
