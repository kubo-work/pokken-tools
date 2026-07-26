import { useState } from "react";
import type { AllowedEmail } from "@/lib/d1/allowedEmails";
import { emailSchema } from "@/lib/schema";
import { sendJson, type FailureMessages } from "@/lib/admin/adminApiClient";
import { ADMIN_API_ENDPOINTS } from "@/lib/admin/endpoints";

const ADD_FAILURE_MESSAGES: FailureMessages = {
  withoutDetail: "追加に失敗しました",
  withDetail: "追加に失敗しました",
};

const REMOVE_FAILURE_MESSAGES: FailureMessages = {
  withoutDetail: "削除に失敗しました",
  withDetail: "削除に失敗しました",
};

const INVALID_EMAIL_MESSAGE = "メールアドレスの形式が不正です";
const DUPLICATE_EMAIL_MESSAGE = "既に登録されています";
const SELF_REMOVAL_MESSAGE = "ログイン中の自分自身は削除できません";

export interface UseAllowedEmailsFormParams {
  initialEmails: AllowedEmail[];
  /** ログイン中の自分のメール。自分自身は削除させない安全装置に使う。 */
  currentUserEmail: string | undefined;
}

export interface UseAllowedEmailsFormResult {
  emails: AllowedEmail[];
  input: string;
  setInput: (value: string) => void;
  error: string | undefined;
  busy: boolean;
  /** 渡されたメールがログイン中の自分かどうか。表示ラベルと削除ボタンの活性で使う。 */
  isCurrentUser: (email: string) => boolean;
  addEmail: () => Promise<void>;
  removeEmail: (email: string) => Promise<void>;
}

/**
 * 許可メール一覧フォームの状態と操作をまとめた hook。
 * 入力検証・API 呼び出し・一覧の更新をここに集約し、AllowedEmailsForm は描画に専念させる。
 */
export const useAllowedEmailsForm = ({
  initialEmails,
  currentUserEmail,
}: UseAllowedEmailsFormParams): UseAllowedEmailsFormResult => {
  const [emails, setEmails] = useState<AllowedEmail[]>(initialEmails);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const isCurrentUser = (email: string): boolean =>
    currentUserEmail !== undefined &&
    email.toLowerCase() === currentUserEmail.toLowerCase();

  const addEmail = async (): Promise<void> => {
    setError(undefined);
    const parsed = emailSchema.safeParse(input.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? INVALID_EMAIL_MESSAGE);
      return;
    }
    const email = parsed.data;
    if (emails.some((entry) => entry.email === email)) {
      setError(DUPLICATE_EMAIL_MESSAGE);
      return;
    }

    setBusy(true);
    const result = await sendJson<AllowedEmail>(
      ADMIN_API_ENDPOINTS.allowedEmails,
      {
        method: "POST",
        body: { email },
        failureMessages: ADD_FAILURE_MESSAGES,
      },
    );
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    const addedEmail = result.data;
    // 追加した行はサーバの応答（createdAt 付き）をそのまま一覧に載せるため、無ければ続行できない。
    if (addedEmail === undefined) {
      setError(ADD_FAILURE_MESSAGES.withoutDetail);
      return;
    }
    setEmails((current) =>
      [...current, addedEmail].sort((a, b) => a.email.localeCompare(b.email)),
    );
    setInput("");
  };

  const removeEmail = async (email: string): Promise<void> => {
    if (isCurrentUser(email)) {
      setError(SELF_REMOVAL_MESSAGE);
      return;
    }
    if (!window.confirm(`${email} を許可リストから削除しますか？`)) {
      return;
    }

    setBusy(true);
    const result = await sendJson(
      `${ADMIN_API_ENDPOINTS.allowedEmails}?email=${encodeURIComponent(email)}`,
      { method: "DELETE", failureMessages: REMOVE_FAILURE_MESSAGES },
    );
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEmails((current) => current.filter((entry) => entry.email !== email));
  };

  return {
    emails,
    input,
    setInput,
    error,
    busy,
    isCurrentUser,
    addEmail,
    removeEmail,
  };
};
