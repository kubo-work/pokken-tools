import type { Metadata, Viewport } from "next";
import { mantineHtmlProps } from "@mantine/core";
import "./globals.css";
import { DevTools } from "@/components/DevTools";
import { THEME, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * サイト全体の既定は noindex（検索除外）。
 * 権利面の露出を抑えるため、検索に載せるのはトップページだけに限定し、
 * キャラページ・技詳細ページ等は各 page で robots を上書きせず既定の noindex を継承させる。
 * トップページ (app/(public)/page.tsx) のみ index 許可へ上書きする。
 */
export const metadata: Metadata = {
  title: "ポッ拳フレーム表",
  description: "ポッ拳DXのキャラ別フレームデータと確定反撃検索",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * 公開側テーマ（data-theme 属性）を描画前に確定させるスクリプト。
 * localStorage の選択を最優先し、未選択ならダークを既定にする（OS 設定に追従しない）。
 * <head> でブロッキング実行することで、初回描画時のテーマのチラつき（FOUC）を防ぐ。
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
 * 最小限のルートレイアウト。
 * SiteHeader や Mantine など UI 部材は (public) / admin それぞれのサブレイアウトで持つ。
 * mantineHtmlProps は admin 配下の color-scheme 切り替えで hydration ミスマッチを避けるため
 * ルートで一度だけ付与しておく（公開側に影響はない）。
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" {...mantineHtmlProps}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <DevTools />
      </body>
    </html>
  );
}
