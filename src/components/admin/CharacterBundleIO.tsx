import {
  Alert,
  Button,
  FileButton,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
} from "@mantine/core";
import { useRef } from "react";
import { useCharacterBundleIO } from "@/hooks/admin/useCharacterBundleIO";

/**
 * 管理トップに置く、全キャラ一括の JSON 入出力 UI。
 * export: 即ダウンロード。import: 検証 → 確認モーダル → 保存。
 */
export const CharacterBundleIO = () => {
  const resetRef = useRef<() => void>(null);

  const {
    exporting,
    importing,
    feedback,
    pendingImport,
    exportBundle,
    selectImportFile,
    confirmImport,
    cancelImport,
  } = useCharacterBundleIO();

  const handleSelectImportFile = async (file: File | null) => {
    await selectImportFile(file);
    resetRef.current?.();
  };

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <Text fw={700}>全キャラ一括 JSON</Text>
        <Group gap="xs">
          <FileButton
            onChange={handleSelectImportFile}
            accept="application/json"
            resetRef={resetRef}
          >
            {(props) => (
              <Button variant="default" size="xs" {...props}>
                一括読み込み
              </Button>
            )}
          </FileButton>
          <Button
            variant="default"
            size="xs"
            onClick={exportBundle}
            loading={exporting}
          >
            一括書き出し
          </Button>
        </Group>
        {feedback !== undefined && (
          <Alert color={feedback.ok ? "teal" : "red"} py={6} px="md">
            {feedback.message}
          </Alert>
        )}
      </Stack>

      <Modal
        opened={pendingImport !== undefined}
        onClose={cancelImport}
        title="一括読み込みの確認"
      >
        {pendingImport !== undefined && (
          <Stack gap="md">
            <Text size="sm">
              {pendingImport.characterCount}キャラを上書きします。
              {pendingImport.hasExceptions
                ? "例外設定（punish exceptions）も置き換えます。"
                : "例外設定は含まれていないため変更されません。"}
            </Text>
            <Group justify="flex-end" gap="xs">
              <Button variant="default" size="xs" onClick={cancelImport}>
                キャンセル
              </Button>
              <Button size="xs" onClick={confirmImport} loading={importing}>
                実行する
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Paper>
  );
};
