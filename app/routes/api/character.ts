import type { Route } from "./+types/character";
import { requireApiUser } from "@/auth/session.server";
import { isKnownCharacterId } from "@/lib/characters/registry";
import { characterSchema } from "@/lib/schema";
import { setCharacter } from "@/lib/kv/setCharacter";
import { parseJsonBody } from "@/lib/parseJsonBody";

/**
 * キャラの技データを KV へ保存(PUT)。resource route。
 * requireApiUser で認証済みのリクエストのみ到達する。
 */
export const action = async ({ request, params }: Route.ActionArgs) => {
  await requireApiUser(request);

  if (request.method !== "PUT") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const { id } = params;
  if (id === undefined || !isKnownCharacterId(id)) {
    return Response.json({ error: "Unknown character id" }, { status: 404 });
  }

  const character = await parseJsonBody(request, characterSchema);
  if (character.id !== id) {
    return Response.json(
      { error: "Path id and body id mismatch" },
      { status: 400 },
    );
  }
  await setCharacter(character);
  return Response.json({ ok: true });
};
