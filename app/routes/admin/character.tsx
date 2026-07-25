import type { Route } from "./+types/character";
import { isKnownCharacterId, getRegistryEntry } from "@/lib/characters/registry";
import { getCharacter } from "@/lib/kv/getCharacters";
import { CharacterEditor } from "@/components/admin/CharacterEditor";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  if (id === undefined || !isKnownCharacterId(id)) {
    throw new Response("Not Found", { status: 404 });
  }
  const entry = getRegistryEntry(id);
  if (entry === undefined) {
    throw new Response("Not Found", { status: 404 });
  }
  const stored = await getCharacter(id);
  const initial = stored ?? {
    id,
    name: entry.name,
    fieldMoves: [],
    duelMoves: [],
  };
  return { initial };
}

export default function AdminCharacterPage({ loaderData }: Route.ComponentProps) {
  return <CharacterEditor initial={loaderData.initial} />;
}
