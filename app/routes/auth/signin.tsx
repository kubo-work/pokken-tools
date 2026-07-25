import { Form } from "react-router";
import type { Route } from "./+types/signin";
import { AUTH_ERROR_CODES } from "@/auth/authConstants";

/**
 * 認証エラー時のメッセージ表示。主に AccessDenied（allowlist 不通過）をユーザーに伝える。
 * キーは生成側（コールバック）と共通の AUTH_ERROR_CODES を使う。
 */
const ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.ACCESS_DENIED]:
    "このアカウントは管理画面へのアクセスが許可されていません。",
  [AUTH_ERROR_CODES.CONFIGURATION]:
    "認証の設定に問題があります。管理者にお問い合わせください。",
  [AUTH_ERROR_CODES.OAUTH_ERROR]:
    "ログイン処理でエラーが発生しました。もう一度お試しください。",
};

export const meta: Route.MetaFunction = () => [
  { title: "管理画面ログイン | ポッ拳フレーム表" },
  { name: "robots", content: "noindex, nofollow" },
];

export function loader({ request }: Route.LoaderArgs) {
  const error = new URL(request.url).searchParams.get("error") ?? undefined;
  const message = error !== undefined ? ERROR_MESSAGES[error] : undefined;
  return { message };
}

export default function SignInPage({ loaderData }: Route.ComponentProps) {
  const { message } = loaderData;

  return (
    <div className="signin-wrap">
      <div className="signin-card">
        <h1 className="signin-title">管理画面ログイン</h1>
        <p className="signin-lead">
          許可されたメールアドレスでのみログインできます。
        </p>
        {message !== undefined && <div className="signin-error">{message}</div>}
        <Form method="post" action="/auth/google">
          <button type="submit" className="signin-button">
            Google でログイン
          </button>
        </Form>
      </div>
    </div>
  );
}
