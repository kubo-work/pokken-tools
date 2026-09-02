import { Link } from "react-router";
import type { Route } from "./+types/home";
import { CHARACTER_REGISTRY } from "@/lib/characters/registry";

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
 *
 * 描画するのは registry のキャラ名だけで、KV は一切読まない。技数など KV 由来の可変な値を
 * 載せないことでページ内容がビルド時に確定し、react-router.config.ts の prerender で
 * 静的 HTML として出力できる（技数は管理画面トップで確認する）。
 */
export default function HomePage() {
  return (
    <>
      <div className="page-head">
        <h1 className="page-title">キャラを選択</h1>
        <p className="page-lead">
          フレームデータを確認したいキャラを選んでください。確定反撃の検索は上部メニューから。
        </p>
      </div>
      <div className="char-grid">
        {CHARACTER_REGISTRY.map((character) => (
          <Link
            key={character.id}
            to={`/characters/${character.id}`}
            className="char-tile"
          >
            <span className="char-tile__name">{character.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
