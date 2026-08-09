import type { Character } from "@/types/character";
import { getEnv } from "@/lib/cloudflare";
import { CHARACTER_REGISTRY, getRegistryEntry } from "@/lib/characters/registry";
import { KV_KEYS } from "./keys";

interface CharacterLike {
  id: string;
  name: string;
  fieldMoves: Character["fieldMoves"];
  duelMoves: Character["duelMoves"];
  commonMoves?: Character["commonMoves"];
}

/**
 * commonMoves 導入前に保存された KV レコードを補完する。
 * KV マイグレーションで一括変換する代わりに読み出し側で吸収する方針のため、
 * 移行完了後に削除できる一時的なシムではなく恒久的な正規化として維持する
 * （ローカル KV・バックアップからの復元など、古い形のレコードは今後も入り得る）。
 */
const withCommonMoves = (stored: CharacterLike): Character => ({
  ...stored,
  commonMoves: stored.commonMoves ?? [],
});

const createFallbackCharacter = (id: string, name: string): Character => ({
  id,
  name,
  fieldMoves: [],
  duelMoves: [],
  commonMoves: [],
});

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
  const stored = await env.FRAME_DATA_KV.get<CharacterLike>(
    KV_KEYS.character(id),
    "json",
  );
  if (stored !== null) {
    return withCommonMoves(stored);
  }
  return createFallbackCharacter(entry.id, entry.name);
}

/**
 * 全キャラを並列取得。registry の順序を保持する。
 * KV に未投入のキャラは registry の名前で空配列を埋める fallback を出す。
 */
export async function getAllCharacters(): Promise<Character[]> {
  const env = await getEnv();
  const results = await Promise.all(
    CHARACTER_REGISTRY.map(async (entry) => {
      const character = await env.FRAME_DATA_KV.get<CharacterLike>(
        KV_KEYS.character(entry.id),
        "json",
      );
      if (character !== null) {
        return withCommonMoves(character);
      }
      return createFallbackCharacter(entry.id, entry.name);
    }),
  );
  return results;
}
