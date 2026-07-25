import { Form, Link, Outlet, redirect } from "react-router";
import type { Route } from "./+types/layout";
import { Button, ColorSchemeScript, MantineProvider } from "@mantine/core";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { adminTheme } from "@/lib/mantine-theme";
import { SURFACE } from "@/lib/admin/surfaceTokens";
import { getSessionUser } from "@/auth/session.server";
import { userContext } from "@/auth/context";
import "@mantine/core/styles.css";

/**
 * admin 配下の認証ガード。
 *
 * middleware はルートがマッチした時点で配下の loader 群より必ず先に実行され、single-fetch の
 * `_routes` による loader 絞り込みでも迂回できない。そのため Next 時代の middleware（/admin
 * 保護）に相当する保護をここで一元化できる。認証済みユーザーは userContext にセットし、配下の
 * loader がセッションを再読み取りせず参照できるようにする。
 */
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }) => {
    const user = await getSessionUser(request);
    if (user === null) {
      throw redirect("/auth/signin");
    }
    context.set(userContext, user);
  },
];

export const loader = ({ context }: Route.LoaderArgs) => {
  return { email: context.get(userContext).email };
};

/**
 * admin 用サブレイアウト。ルート layout が <html>/<body> を担当するため、
 * ここでは Provider と内側の枠だけを置く。ColorSchemeScript は本来 <head> 用だが
 * サブレイアウトでは body 直下でも機能する。
 */
export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { email } = loaderData;

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
            <Link to="/admin">キャラ</Link>
            <Link to="/admin/exceptions">例外</Link>
            <Link to="/admin/allowed-emails">アクセス許可</Link>
            <Link to="/" style={{ color: "var(--mantine-color-dimmed)" }}>
              公開サイト
            </Link>
          </nav>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 13,
            }}
          >
            <span style={{ color: "var(--mantine-color-dimmed)" }}>{email}</span>
            <Form method="post" action="/auth/signout">
              <Button type="submit" variant="default" size="xs">
                ログアウト
              </Button>
            </Form>
            <AdminThemeToggle />
          </div>
        </header>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px 80px" }}>
          <Outlet />
        </div>
      </MantineProvider>
    </>
  );
}
