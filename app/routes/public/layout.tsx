import { Outlet } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

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
