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

/**
 * key にキャラ ID を渡し、別キャラへ遷移したときだけ CharacterEditor を再マウントさせる。
 * これで編集中の state がリセットされる（hook 側で props を state へ同期しないで済む）。
 */
export default function AdminCharacterPage({ loaderData }: Route.ComponentProps) {
  return (
    <CharacterEditor
      key={loaderData.initial.id}
      initial={loaderData.initial}
    />
  );
}
