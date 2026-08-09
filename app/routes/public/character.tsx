import { Link } from "react-router";
import type { Route } from "./+types/character";
import { getCharacter } from "@/lib/kv/getCharacters";
import { isKnownCharacterId } from "@/lib/characters/registry";
import { MovesTable } from "@/components/MovesTable";

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  if (id === undefined || !isKnownCharacterId(id)) {
    throw new Response("Not Found", { status: 404 });
  }
  const character = await getCharacter(id);
  if (character === undefined) {
    throw new Response("Not Found", { status: 404 });
  }
  return { id, character };
}

export default function CharacterPage({ loaderData }: Route.ComponentProps) {
  const { id, character } = loaderData;

  return (
    <>
      <div
        className="page-head"
        style={{ display: "flex", gap: 16, alignItems: "center" }}
      >
        <div style={{ flex: 1 }}>
          <h1 className="page-title">{character.name}</h1>
        </div>
        <Link
          to={`/characters/${id}/punish`}
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
        <MovesTable moves={character.duelMoves} characterId={id} />
      </section>

      <section className="moves-section">
        <div className="moves-section__head">
          <h2 className="moves-section__title">
            フィールドフェイズ ({character.fieldMoves.length}技)
          </h2>
        </div>
        <MovesTable moves={character.fieldMoves} characterId={id} />
      </section>

      <section className="moves-section">
        <div className="moves-section__head">
          <h2 className="moves-section__title">
            共通 ({character.commonMoves.length}技)
          </h2>
        </div>
        <MovesTable moves={character.commonMoves} characterId={id} />
      </section>
    </>
  );
}
