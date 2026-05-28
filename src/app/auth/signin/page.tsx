import { signIn } from "@/lib/auth/config";

/**
 * 認証エラー時のメッセージ表示用クエリパラメータを受ける。
 * 主に AccessDenied（allowlist 不通過）をユーザーに伝えるために使う。
 */
type SearchParams = Promise<{ error?: string; callbackUrl?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "このアカウントは管理画面へのアクセスが許可されていません。",
  Configuration: "認証の設定に問題があります。管理者にお問い合わせください。",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error, callbackUrl } = await searchParams;
  const message = error !== undefined ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="signin-wrap">
      <div className="signin-card">
        <h1 className="signin-title">管理画面ログイン</h1>
        <p className="signin-lead">
          許可されたメールアドレスでのみログインできます。
        </p>
        {message !== undefined && <div className="signin-error">{message}</div>}
        <form
          action={async () => {
            "use server";
            await signIn("google", {
              redirectTo: callbackUrl ?? "/admin",
            });
          }}
        >
          <button type="submit" className="signin-button">
            Google でログイン
          </button>
        </form>
      </div>
    </div>
  );
}
