import type { PunishException } from "@/types/move";
import { getEnv } from "@/lib/cloudflare";
import type { KvReadOptions } from "./cacheTtl";
import { toJsonGetOptions } from "./cacheTtlStorage";
import { KV_KEYS } from "./keys";

export const getExceptions = async (
  options: KvReadOptions = {},
): Promise<PunishException[]> => {
  const env = await getEnv();
  const value = await env.FRAME_DATA_KV.get<PunishException[]>(
    KV_KEYS.exceptions,
    toJsonGetOptions(options),
  );
  return value ?? [];
};

export const setExceptions = async (
  exceptions: PunishException[],
): Promise<void> => {
  const env = await getEnv();
  await env.FRAME_DATA_KV.put(KV_KEYS.exceptions, JSON.stringify(exceptions));
};
