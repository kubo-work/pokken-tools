import Link from "next/link";
import { notFound } from "next/navigation";
import { getCharacter } from "@/lib/kv/getCharacters";
import { isKnownCharacterId } from "@/lib/characters/registry";
import { MovesTable } from "@/components/MovesTable";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function CharacterPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!isKnownCharacterId(id)) {
    notFound();
  }
  const character = await getCharacter(id);
  if (character === undefined) {
    notFound();
  }

  return (
    <>
      <div className="page-head" style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">{character.name}</h1>
          {character.title !== undefined && (
            <p className="page-lead">{character.title}</p>
          )}
        </div>
        <Link
          href={`/characters/${id}/punish`}
          style={{
            padding: "8px 14px",
            borderRadius: 8,
            background: "#f59e0b",
            color: "#000",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          このキャラで確定反撃検索
        </Link>
      </div>

      <section className="moves-section">
        <div className="moves-section__head">
          <h2 className="moves-section__title">
            デュエルフェイズ ({character.duelMoves.length}技)
          </h2>
        </div>
        <MovesTable moves={character.duelMoves} />
      </section>

      <section className="moves-section">
        <div className="moves-section__head">
          <h2 className="moves-section__title">
            フィールドフェイズ ({character.fieldMoves.length}技)
          </h2>
        </div>
        <MovesTable moves={character.fieldMoves} />
      </section>
    </>
  );
}
