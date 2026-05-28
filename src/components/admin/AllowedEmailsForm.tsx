"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import type { AllowedEmail } from "@/lib/d1/allowedEmails";
import { emailSchema } from "@/lib/schema";

export function AllowedEmailsForm({
  initialEmails,
  currentUserEmail,
}: {
  initialEmails: AllowedEmail[];
  /** ログイン中の自分のメール。自分自身は削除させない安全装置に使う。 */
  currentUserEmail: string | undefined;
}) {
  const [emails, setEmails] = useState<AllowedEmail[]>(initialEmails);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    setError(undefined);
    const parsed = emailSchema.safeParse(input.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "メールアドレスの形式が不正です");
      return;
    }
    const email = parsed.data;
    if (emails.some((entry) => entry.email === email)) {
      setError("既に登録されています");
      return;
    }
    setBusy(true);
    const response = await fetch("/api/admin/allowed-emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("追加に失敗しました");
      return;
    }
    const added = (await response.json()) as AllowedEmail;
    setEmails((current) =>
      [...current, added].sort((a, b) => a.email.localeCompare(b.email)),
    );
    setInput("");
  }

  async function handleRemove(email: string) {
    if (
      currentUserEmail !== undefined &&
      email.toLowerCase() === currentUserEmail.toLowerCase()
    ) {
      setError("ログイン中の自分自身は削除できません");
      return;
    }
    if (!window.confirm(`${email} を許可リストから削除しますか？`)) {
      return;
    }
    setBusy(true);
    const response = await fetch(
      `/api/admin/allowed-emails?email=${encodeURIComponent(email)}`,
      { method: "DELETE" },
    );
    setBusy(false);
    if (!response.ok) {
      setError("削除に失敗しました");
      return;
    }
    setEmails((current) => current.filter((entry) => entry.email !== email));
  }

  return (
    <Stack gap="lg">
      <Title order={2}>アクセス許可メール</Title>
      <Text size="sm" c="dimmed">
        ここに登録されたメールアドレスのみが Google でログインして管理画面に入れます。
        自分自身を削除すると締め出されるので、追加してから削除する運用を推奨します。
      </Text>

      <Paper withBorder p="md">
        <Group align="flex-end" gap="sm">
          <TextInput
            label="メールアドレスを追加"
            placeholder="user@example.com"
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={handleAdd} loading={busy}>
            追加
          </Button>
        </Group>
        {error !== undefined && (
          <Alert color="red" mt="sm" py={6}>
            {error}
          </Alert>
        )}
      </Paper>

      {emails.length === 0 ? (
        <Text c="dimmed">登録されているメールアドレスはありません。</Text>
      ) : (
        <Stack gap="xs">
          {emails.map((entry) => (
            <Paper key={entry.email} withBorder p="sm">
              <Group justify="space-between">
                <div>
                  <Text>{entry.email}</Text>
                  <Text size="xs" c="dimmed">
                    {entry.createdAt}
                    {currentUserEmail !== undefined &&
                    entry.email.toLowerCase() === currentUserEmail.toLowerCase()
                      ? "（あなた）"
                      : ""}
                  </Text>
                </div>
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  disabled={
                    currentUserEmail !== undefined &&
                    entry.email.toLowerCase() === currentUserEmail.toLowerCase()
                  }
                  onClick={() => handleRemove(entry.email)}
                >
                  削除
                </Button>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
