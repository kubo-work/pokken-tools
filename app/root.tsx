import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { mantineHtmlProps } from "@mantine/core";
import type { Route } from "./+types/root";
import { DevTools } from "@/components/DevTools";
import { THEME, THEME_STORAGE_KEY } from "@/lib/theme";
import "@/styles/globals.css";

/**
 * サイト全体の既定メタ。既定は noindex（検索除外）で権利面の露出を抑える。
 * meta は「最後にマッチしたルートが完全置換」される仕様のため、各 route が meta を
 * エクスポートしない限りこの既定（noindex）が適用される。トップページ（home）だけが
 * 自前の meta で index 許可へ上書きする。個別 title を出すページ（disclaimer / 技詳細）は
 * 置換になるため、それぞれの meta 側で noindex を明示する。
 */
export const meta: Route.MetaFunction = () => [
  { title: "ポッ拳フレーム表" },
  {
    name: "description",
    content: "ポッ拳DXのキャラ別フレームデータと確定反撃検索",
  },
  { name: "robots", content: "noindex, nofollow" },
];

/**
 * 公開側テーマ（data-theme 属性）を描画前に確定させるスクリプト。
 * localStorage の選択を最優先し、未選択ならダークを既定にする（OS 設定に追従しない）。
 * <head> でブロッキング実行することで初回描画時のテーマのチラつき（FOUC）を防ぐ。
 */
const themeInitScript = `(function () {
  try {
    const stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    const theme = stored || "${THEME.DARK}";
    document.documentElement.dataset.theme = theme;
  } catch {
    // localStorage 不可（プライベートモード等）の場合は CSS 既定（ダーク）にフォールバックする
  }
})();`;

/**
 * 最小限のルートレイアウト。SiteHeader や Mantine など UI 部材は public / admin それぞれの
 * サブレイアウト（レイアウトルート）で持つ。mantineHtmlProps は admin 配下の color-scheme
 * 切り替えで hydration ミスマッチを避けるためルートで一度だけ付与する（公開側に影響はない）。
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <DevTools />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "エラーが発生しました";
  let detail = "予期しないエラーが発生しました。";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "ページが見つかりません";
      detail = "お探しのページは存在しないか、移動した可能性があります。";
    } else {
      title = `${error.status} エラー`;
      detail = error.statusText || detail;
    }
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">{title}</h1>
        <p className="page-lead">{detail}</p>
      </div>
    </main>
  );
}
