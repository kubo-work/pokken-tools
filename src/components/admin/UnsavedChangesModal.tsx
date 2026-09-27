import { Alert, Button, Group, Modal, Stack, Text } from "@mantine/core";
import type { Blocker } from "react-router";

/**
 * 未保存の変更がある状態でアプリ内遷移が止められたときの確認ダイアログ。
 * 閉じる操作（× / Esc / 背景クリック）は、変更を失わない「編集を続ける」と同じ扱いにする。
 * 保存中は「破棄して移動」を押せなくする。移動するとエディタごと消え、保存が失敗しても
 * 通知する場所がなくなるため、完了（成否がこの画面に表示される）まで待たせる。
 */
export const UnsavedChangesModal = ({
  blocker,
  saving,
}: {
  blocker: Blocker;
  saving: boolean;
}) => {
  const continueEditing = () => blocker.reset?.();
  const discardAndLeave = () => blocker.proceed?.();

  return (
    <Modal
      opened={blocker.state === "blocked"}
      onClose={continueEditing}
      title="未保存の変更があります"
    >
      <Stack gap="md">
        <Text size="sm">
          このページを離れると、保存していない変更は破棄されます。
        </Text>
        {saving && (
          <Alert color="yellow" py={6} px="md">
            保存処理中です。完了するまで移動できません。失敗した場合はこの画面に表示されます。
          </Alert>
        )}
        <Group justify="flex-end" gap="xs">
          <Button variant="default" size="xs" onClick={continueEditing}>
            編集を続ける
          </Button>
          <Button
            color="red"
            size="xs"
            onClick={discardAndLeave}
            disabled={saving}
          >
            破棄して移動
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
