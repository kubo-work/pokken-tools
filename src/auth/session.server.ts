import { createCookieSessionStorage, redirect } from "react-router";
import { getEnv } from "@/lib/cloudflare";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/auth/authConstants";

/**
 * 管理画面のセッション管理。
 *
 * next-auth（JWT 戦略・D1 にセッションテーブルを持たない）を、署名付き Cookie セッションで
 * 置き換える。保持するのは許可済みユーザーのメールのみ。secret は Cloudflare env の
 * AUTH_SECRET（.dev.vars / Workers Secrets）を使う。
 *
 * 注意: Cookie 形式が next-auth と変わるため、移行デプロイ時に既存ログインは失効し全員
 * 再ログインになる（admin 限定機能のため影響は小さい）。
 */

/** セッションに保持するユーザー。認証まわりで共有する唯一のユーザー型。 */
export interface SessionUser {
  email: string;
}

interface SessionData {
  user: SessionUser;
}

// AUTH_SECRET はリクエスト間で不変のため、Worker アイソレート内でストレージをキャッシュしてよい。
let cachedSessionStorage:
  | ReturnType<typeof createCookieSessionStorage<SessionData>>
  | undefined;

const getSessionStorage = async () => {
  if (cachedSessionStorage === undefined) {
    const env = await getEnv();
    cachedSessionStorage = createCookieSessionStorage<SessionData>({
      cookie: {
        name: SESSION_COOKIE_NAME,
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: import.meta.env.PROD,
        maxAge: SESSION_MAX_AGE_SECONDS,
        secrets: [env.AUTH_SECRET],
      },
    });
  }
  return cachedSessionStorage;
};

/** リクエストの Cookie からログイン中ユーザーを取り出す。未ログインなら null。 */
export const getSessionUser = async (
  request: Request,
): Promise<SessionUser | null> => {
  const storage = await getSessionStorage();
  const session = await storage.getSession(request.headers.get("Cookie"));
  return session.get("user") ?? null;
};

/**
 * API（/api/admin/*）用の認証必須ガード。未ログインなら 401 JSON を throw する
 * （Next 時代の middleware が /api/admin に返していた 401 と同じ役割）。
 * React Router は throw された Response をそのまま応答として返す。
 */
export const requireApiUser = async (
  request: Request,
): Promise<SessionUser> => {
  const user = await getSessionUser(request);
  if (user === null) {
    throw Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
};

/** ユーザーをセッションに保存し、redirectTo へリダイレクトする Response を返す。 */
export const createUserSession = async (
  request: Request,
  user: SessionUser,
  redirectTo: string,
): Promise<Response> => {
  const storage = await getSessionStorage();
  const session = await storage.getSession(request.headers.get("Cookie"));
  session.set("user", user);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await storage.commitSession(session) },
  });
};

/** セッションを破棄し、redirectTo へリダイレクトする Response を返す。 */
export const destroyUserSession = async (
  request: Request,
  redirectTo: string,
): Promise<Response> => {
  const storage = await getSessionStorage();
  const session = await storage.getSession(request.headers.get("Cookie"));
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await storage.destroySession(session) },
  });
};
