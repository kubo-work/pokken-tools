import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cloudflare";
import { isEmailAllowed } from "@/lib/d1/allowedEmails";

declare module "next-auth" {
  interface Session {
    user: {
      email: string;
    } & DefaultSession["user"];
  }
}

/**
 * Auth.js v5 設定。
 *
 * - セッション戦略: JWT（D1 にセッションテーブルを持たない）。
 * - signIn コールバックで D1 allowed_emails を照合。未登録ならログイン拒否。
 * - authorized コールバックで /admin・/api/admin を保護。middleware から呼ばれる。
 *
 * secret / OAuth クレデンシャルは Cloudflare の env バインディング（.dev.vars /
 * Workers Secrets）にしか存在せず process.env には載らないため、非同期 config 関数で
 * getEnv() から読む。trustHost はリバースプロキシ（Cloudflare）配下でホストを
 * 信頼してリダイレクト URL を組み立てるために有効化する。
 *
 * 注意: 非同期 config 関数（lazy init）では auth が async 関数になるため、
 *      `export default auth((req) => {...})` の wrapper 形式は使えない（Promise を
 *      返し middleware の default export が関数でなくなる）。保護ロジックは
 *      authorized に置き、middleware は `export { auth as default }` で使う。
 */
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const env = await getEnv();
  return {
    secret: env.AUTH_SECRET,
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [
      Google({
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
      }),
    ],
    pages: {
      signIn: "/auth/signin",
    },
    callbacks: {
      // middleware から呼ばれ、/admin・/api/admin を保護する。
      // signIn コールバックで D1 allowlist を照合済みのため、ここでは
      // セッションの有無だけ判定すれば十分。
      authorized({ request, auth }) {
        const { pathname } = request.nextUrl;
        const isProtected =
          pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
        if (!isProtected || auth !== null) {
          return true;
        }
        if (pathname.startsWith("/api/admin")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const signinUrl = new URL("/auth/signin", request.nextUrl);
        signinUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signinUrl);
      },
      async signIn({ user }) {
        if (typeof user.email !== "string" || user.email === "") {
          return false;
        }
        const allowed = await isEmailAllowed(user.email);
        return allowed;
      },
      async session({ session, token }) {
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
        return session;
      },
    },
  };
});
