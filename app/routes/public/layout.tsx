import { Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { withPublicKvCacheTtl } from "@/lib/kv/publicCacheTtl.server";

/**
 * 公開ページの KV 読み取りにエッジキャッシュを効かせる。
 *
 * middleware はマッチしたルート配下の loader より必ず先に実行されるため、ここに置けば
 * 公開ルートを追加したときの設定漏れが起きない。管理者のリクエストではキャッシュを張らず、
 * 保存直後の内容を公開ページでそのまま確認できるようにする。
 */
export const middleware: Route.MiddlewareFunction[] = [withPublicKvCacheTtl];

/** 公開ページ共通レイアウト。SiteHeader / main / SiteFooter で子ルートを挟む。 */
export default function PublicLayout() {
  return (
    <>
      <SiteHeader />
      <main className="container">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
