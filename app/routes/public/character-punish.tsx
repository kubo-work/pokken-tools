import { Link } from "react-router";
import type { Route } from "./+types/character-punish";
import { getAllCharacters } from "@/lib/kv/getCharacters";
import { getExceptions } from "@/lib/kv/exceptions";
import { isKnownCharacterId, getRegistryEntry } from "@/lib/characters/registry";
import { PunishSearch } from "@/components/PunishSearch";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  if (id === undefined || !isKnownCharacterId(id)) {
    throw new Response("Not Found", { status: 404 });
  }
  const entry = getRegistryEntry(id);
  if (entry === undefined) {
    throw new Response("Not Found", { status: 404 });
  }
  const [characters, exceptions] = await Promise.all([
    getAllCharacters(),
    getExceptions(),
  ]);
  return { id, entryName: entry.name, characters, exceptions };
}

export default function CharacterPunishPage({
  loaderData,
}: Route.ComponentProps) {
  const { id, entryName, characters, exceptions } = loaderData;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{entryName} の確定反撃</h1>
        <p className="page-lead">
          {entryName} で反撃できる技を検索します。攻撃側の技を選んでください。{" "}
          <Link
            to="/punish"
            style={{ color: "#f59e0b", textDecoration: "underline" }}
          >
            キャラを問わず検索
          </Link>
        </p>
      </div>
      <PunishSearch
        characters={characters}
        exceptions={exceptions}
        fixedDefenderCharacterId={id}
      />
    </>
  );
}
