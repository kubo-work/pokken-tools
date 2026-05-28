import type { Character } from "@/types/character";
import { getEnv } from "@/lib/cloudflare";
import { KV_KEYS } from "./keys";

export async function setCharacter(character: Character): Promise<void> {
  const env = await getEnv();
  await env.FRAME_DATA_KV.put(KV_KEYS.character(character.id), JSON.stringify(character));
}
