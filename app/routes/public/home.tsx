import { Link } from "react-router";
import type { Route } from "./+types/home";
import { getAllCharacters } from "@/lib/kv/getCharacters";
import { buildCharacterTiles } from "@/lib/characterTiles";

/**
 * トップページだけは検索に載せる。root の既定 noindex を index 許可へ上書きする。
 * follow: true でトップから各ページへのクロール導線は残すが、リンク先は noindex のため
 * インデックスされない。
 */
export const meta: Route.MetaFunction = () => [
  { title: "ポッ拳フレーム表" },
  {
    name: "description",
    content: "ポッ拳DXのキャラ別フレームデータと確定反撃検索",
  },
  { name: "robots", content: "index, follow" },
];

/**
 * トップ: 23 キャラのテキストタイル選択グリッド。
 * KV に投入済みの技数も小さく表示する（未投入のキャラは 0/0）。
 */
export async function loader() {
  const tiles = buildCharacterTiles(await getAllCharacters());
  return { tiles };
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { tiles } = loaderData;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">キャラを選択</h1>
        <p className="page-lead">
          フレームデータを確認したいキャラを選んでください。確定反撃の検索は上部メニューから。
        </p>
      </div>
      <div className="char-grid">
        {tiles.map((tile) => (
          <Link
            key={tile.id}
            to={`/characters/${tile.id}`}
            className="char-tile"
          >
            <span className="char-tile__name">{tile.name}</span>
            <span className="char-tile__meta">
              <span>FP {tile.field}</span>
              <span>DP {tile.duel}</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
