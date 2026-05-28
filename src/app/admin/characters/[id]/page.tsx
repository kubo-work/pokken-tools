import { notFound } from "next/navigation";
import { isKnownCharacterId, getRegistryEntry } from "@/lib/characters/registry";
import { getCharacter } from "@/lib/kv/getCharacters";
import { CharacterEditor } from "@/components/admin/CharacterEditor";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminCharacterPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!isKnownCharacterId(id)) {
    notFound();
  }
  const entry = getRegistryEntry(id);
  if (entry === undefined) {
    notFound();
  }

  const stored = await getCharacter(id);
  const initial = stored ?? {
    id,
    name: entry.name,
    fieldMoves: [],
    duelMoves: [],
  };

  return <CharacterEditor initial={initial} />;
}
