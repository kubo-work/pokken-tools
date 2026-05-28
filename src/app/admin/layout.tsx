import Link from "next/link";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { auth, signOut } from "@/lib/auth/config";
import "@mantine/core/styles.css";

/**
 * admin 用サブレイアウト。
 * ルート layout が <html>/<body> を担当するため、ここでは Provider と内側の枠だけを置く。
 * ColorSchemeScript は本来 <head> 用だが、サブレイアウトでは body 直下でも機能する。
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <ColorSchemeScript defaultColorScheme="dark" />
      <MantineProvider defaultColorScheme="dark">
        <header
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid #2a2a35",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            background: "#0b0b0f",
          }}
        >
          <nav style={{ display: "flex", gap: 16, fontSize: 14 }}>
            <Link href="/admin">キャラ</Link>
            <Link href="/admin/exceptions">例外</Link>
            <Link href="/admin/allowed-emails">アクセス許可</Link>
            <Link href="/" style={{ color: "#9095a0" }}>
              公開サイト
            </Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
            <span style={{ color: "#9095a0" }}>{session?.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                style={{
                  background: "transparent",
                  color: "#9095a0",
                  border: "1px solid #2a2a35",
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ログアウト
              </button>
            </form>
          </div>
        </header>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px 80px" }}>
          {children}
        </div>
      </MantineProvider>
    </>
  );
}
