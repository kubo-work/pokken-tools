import { redirect } from "react-router";
import type { Route } from "./+types/google-callback";
import { getAuthenticator, GOOGLE_STRATEGY } from "@/auth/authenticator.server";
import { createUserSession, type SessionUser } from "@/auth/session.server";
import { AUTH_ERROR_CODES } from "@/auth/authConstants";
import { isEmailAllowed } from "@/lib/d1/allowedEmails";

/**
 * OAuth コールバック（resource route）。
 * Google からのリダイレクトを受けてユーザーを解決し、D1 allowlist を照合する。
 * 未登録なら AccessDenied でサインイン画面へ、許可済みならセッションを張って /admin へ。
 * （next-auth の signIn コールバックでの allowlist 照合と同じ役割）
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const authenticator = await getAuthenticator(request);

  let user: SessionUser;
  try {
    user = await authenticator.authenticate(GOOGLE_STRATEGY, request);
  } catch (error) {
    // remix-auth が state 検証等で Response（リダイレクト）を throw した場合はそのまま返す。
    if (error instanceof Response) {
      throw error;
    }
    console.error("OAuth callback failed", error);
    throw redirect(`/auth/signin?error=${AUTH_ERROR_CODES.OAUTH_ERROR}`);
  }

  const allowed = await isEmailAllowed(user.email);
  if (!allowed) {
    throw redirect(`/auth/signin?error=${AUTH_ERROR_CODES.ACCESS_DENIED}`);
  }

  return await createUserSession(request, user, "/admin");
};
