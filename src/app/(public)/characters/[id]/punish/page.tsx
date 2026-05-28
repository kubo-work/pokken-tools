import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllCharacters } from "@/lib/kv/getCharacters";
import { getExceptions } from "@/lib/kv/exceptions";
import { isKnownCharacterId, getRegistryEntry } from "@/lib/characters/registry";
import { PunishSearch } from "@/app/(public)/punish/PunishSearch";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function CharacterPunishPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!isKnownCharacterId(id)) {
    notFound();
  }
  const entry = getRegistryEntry(id);
  if (entry === undefined) {
    notFound();
  }

  const [characters, exceptions] = await Promise.all([
    getAllCharacters(),
    getExceptions(),
  ]);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{entry.name} の確定反撃</h1>
        <p className="page-lead">
          {entry.name} で反撃できる技を検索します。攻撃側の技を選んでください。
          {" "}
          <Link href="/punish" style={{ color: "#f59e0b", textDecoration: "underline" }}>
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
