/**
 * 認証まわりの定数を一元管理する。
 * エラーコードは「生成側（コールバックのリダイレクト）」と「消費側（サインイン画面の
 * メッセージ表）」で同じ値を参照する必要があるため、リテラルの二重定義を避けてここに集約する。
 */
export const AUTH_ERROR_CODES = {
  /** allowlist 未登録でログインを拒否した。 */
  ACCESS_DENIED: "AccessDenied",
  /** 認証設定の不備。 */
  CONFIGURATION: "Configuration",
  /** OAuth コールバック処理中のエラー。 */
  OAUTH_ERROR: "OAuthError",
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

/** セッション Cookie 名。 */
export const SESSION_COOKIE_NAME = "__pokken_session";

/** OAuth の state / PKCE 検証値を保持する一時 Cookie 名（remix-auth-oauth2 に渡す）。 */
export const OAUTH_STATE_COOKIE_NAME = "oauth2";

/** セッション有効期限（秒）。next-auth の JWT 既定（30日）に合わせる。 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
