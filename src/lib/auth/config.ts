import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
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
 * - middleware から auth ヘルパを呼ぶため、ここで一元的に export する。
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
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
});
