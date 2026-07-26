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
import { useAllowedEmailsForm } from "@/hooks/admin/useAllowedEmailsForm";

export interface AllowedEmailsFormProps {
  initialEmails: AllowedEmail[];
  /** ログイン中の自分のメール。自分自身は削除させない安全装置に使う。 */
  currentUserEmail: string | undefined;
}

export const AllowedEmailsForm = ({
  initialEmails,
  currentUserEmail,
}: AllowedEmailsFormProps) => {
  const {
    emails,
    input,
    setInput,
    error,
    busy,
    isCurrentUser,
    addEmail,
    removeEmail,
  } = useAllowedEmailsForm({ initialEmails, currentUserEmail });

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
          <Button onClick={addEmail} loading={busy}>
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
                    {isCurrentUser(entry.email) ? "（あなた）" : ""}
                  </Text>
                </div>
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  disabled={isCurrentUser(entry.email)}
                  onClick={() => removeEmail(entry.email)}
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
};
