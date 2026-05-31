import type { Metadata, Viewport } from "next";
import { mantineHtmlProps } from "@mantine/core";
import "./globals.css";
import { DevTools } from "@/components/DevTools";

export const metadata: Metadata = {
  title: "ポッ拳フレーム表",
  description: "ポッ拳DXのキャラ別フレームデータと確定反撃検索",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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
      <body>
        {children}
        <DevTools />
      </body>
    </html>
  );
}
