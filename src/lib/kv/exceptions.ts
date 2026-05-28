import type { PunishException } from "@/types/move";
import { getEnv } from "@/lib/cloudflare";
import { KV_KEYS } from "./keys";

export async function getExceptions(): Promise<PunishException[]> {
  const env = await getEnv();
  const value = await env.FRAME_DATA_KV.get<PunishException[]>(KV_KEYS.exceptions, "json");
  return value ?? [];
}

export async function setExceptions(exceptions: PunishException[]): Promise<void> {
  const env = await getEnv();
  await env.FRAME_DATA_KV.put(KV_KEYS.exceptions, JSON.stringify(exceptions));
}
