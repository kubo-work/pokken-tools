import type { Metadata } from "next";
import Link from "next/link";
import { CHARACTER_REGISTRY } from "@/lib/characters/registry";
import { getAllCharacters } from "@/lib/kv/getCharacters";

export const dynamic = "force-dynamic";

/**
 * トップページだけは検索に載せる。ルートレイアウトの既定 noindex を index 許可へ上書きする。
 * follow: true でトップから各ページへのクロール導線は残すが、リンク先は noindex のためインデックスされない。
 */
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

/**
 * トップ: 23 キャラのテキストタイル選択グリッド。
 * KV に投入済みの技数も小さく表示する（未投入のキャラは 0/0）。
 */
export default async function HomePage() {
  const characters = await getAllCharacters();
  const moveCountsById = new Map(
    characters.map((character) => [
      character.id,
      { field: character.fieldMoves.length, duel: character.duelMoves.length },
    ]),
  );

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">キャラを選択</h1>
        <p className="page-lead">
          フレームデータを確認したいキャラを選んでください。確定反撃の検索は上部メニューから。
        </p>
      </div>
      <div className="char-grid">
        {CHARACTER_REGISTRY.map((entry) => {
          const counts = moveCountsById.get(entry.id) ?? { field: 0, duel: 0 };
          return (
            <Link
              key={entry.id}
              href={`/characters/${entry.id}`}
              className="char-tile"
            >
              <span className="char-tile__name">{entry.name}</span>
              <span className="char-tile__meta">
                <span>FP {counts.field}</span>
                <span>DP {counts.duel}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
