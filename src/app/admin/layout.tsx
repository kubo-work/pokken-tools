import Link from "next/link";
import { Button, ColorSchemeScript, MantineProvider } from "@mantine/core";
import { auth, signOut } from "@/lib/auth/config";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { adminTheme } from "@/lib/mantine-theme";
import { SURFACE } from "@/lib/admin/surfaceTokens";
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
      <MantineProvider theme={adminTheme} defaultColorScheme="dark">
        <header
          style={{
            padding: "12px 24px",
            borderBottom: `1px solid ${SURFACE.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            background: SURFACE.card,
          }}
        >
          <nav
            style={{
              display: "flex",
              gap: 16,
              fontSize: 14,
              color: "var(--mantine-color-text)",
            }}
          >
            <Link href="/admin">キャラ</Link>
            <Link href="/admin/exceptions">例外</Link>
            <Link href="/admin/allowed-emails">アクセス許可</Link>
            <Link href="/" style={{ color: "var(--mantine-color-dimmed)" }}>
              公開サイト
            </Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
            <span style={{ color: "var(--mantine-color-dimmed)" }}>
              {session?.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="default" size="xs">
                ログアウト
              </Button>
            </form>
            <AdminThemeToggle />
          </div>
        </header>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px 80px" }}>
          {children}
        </div>
      </MantineProvider>
    </>
  );
}
