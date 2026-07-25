import { Authenticator } from "remix-auth";
import { OAuth2Strategy } from "remix-auth-oauth2";
import { z } from "zod";
import { getEnv } from "@/lib/cloudflare";
import type { SessionUser } from "@/auth/session.server";
import { OAUTH_STATE_COOKIE_NAME } from "@/auth/authConstants";
import { emailSchema } from "@/lib/schema";

/**
 * Google OAuth 認証（remix-auth + OAuth2 ストラテジー）。
 *
 * next-auth の Google プロバイダ相当。verify では access token で Google の userinfo を叩き、
 * メールアドレスを取り出す。allowlist 照合はコールバックルート側で行う（未許可時のリダイレクト先を
 * 制御したいため）。
 *
 * リダイレクト URI はリクエストの origin から組み立てるため、dev（http://localhost:2015）と
 * 本番の双方で正しく機能する。Google Cloud Console の「承認済みリダイレクト URI」に
 * `<origin>/auth/google/callback` を登録しておくこと（next-auth 時代の
 * `/api/auth/callback/google` から変更になる）。
 */

const GOOGLE_AUTHORIZATION_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT =
  "https://openidconnect.googleapis.com/v1/userinfo";

/** ストラテジー名。start / callback ルートの authenticate 呼び出しと一致させる。 */
export const GOOGLE_STRATEGY = "google";

/** Google userinfo レスポンスから必要なメールだけを検証して取り出す。 */
const googleUserInfoSchema = z.object({ email: emailSchema });

export const getAuthenticator = async (
  request: Request,
): Promise<Authenticator<SessionUser>> => {
  const env = await getEnv();
  const redirectURI = new URL("/auth/google/callback", request.url).toString();

  const authenticator = new Authenticator<SessionUser>();
  authenticator.use(
    new OAuth2Strategy(
      {
        cookie: OAUTH_STATE_COOKIE_NAME,
        clientId: env.AUTH_GOOGLE_ID,
        clientSecret: env.AUTH_GOOGLE_SECRET,
        authorizationEndpoint: GOOGLE_AUTHORIZATION_ENDPOINT,
        tokenEndpoint: GOOGLE_TOKEN_ENDPOINT,
        redirectURI,
        scopes: ["openid", "email", "profile"],
      },
      async ({ tokens }) => {
        const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
          headers: { Authorization: `Bearer ${tokens.accessToken()}` },
        });
        if (!response.ok) {
          throw new Error("Google userinfo の取得に失敗しました");
        }
        const parsed = googleUserInfoSchema.safeParse(await response.json());
        if (!parsed.success) {
          throw new Error(
            "Google userinfo に有効なメールアドレスがありませんでした",
          );
        }
        return { email: parsed.data.email };
      },
    ),
    GOOGLE_STRATEGY,
  );
  return authenticator;
};
