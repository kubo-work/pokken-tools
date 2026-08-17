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
import { useRevalidator } from "react-router";
import { useCharacterBundleIO } from "@/hooks/admin/useCharacterBundleIO";

/**
 * 管理トップに置く、全キャラ一括の JSON 入出力 UI。
 * export: 即ダウンロード。import: 検証 → 確認モーダル → 保存。
 *
 * 一括インポートは Form/useFetcher を介さない生の fetch のため、React Router は
 * loader を自動で再検証しない。保存成功時に revalidate() を呼び、ルートの loader
 * （getAllCharacters 由来の一覧）を明示的に再読み込みする。hook 側は React Router の
 * ルーティング文脈に結合させたくないため、この呼び出しはコンポーネント側で完結させる。
 */
export const CharacterBundleIO = () => {
  const resetRef = useRef<() => void>(null);
  const revalidator = useRevalidator();

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
    try {
      await selectImportFile(file);
    } finally {
      // selectImportFile が例外を投げた場合でもリセットする。ここを後段に置くと
      // 例外時にリセットされず「同一ファイル再選択が効かない」バグが復活する。
      resetRef.current?.();
    }
  };

  const handleConfirmImport = async () => {
    const imported = await confirmImport();
    if (imported) {
      revalidator.revalidate();
    }
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
            disabled={importing}
          >
            {(props) => (
              <Button variant="default" size="xs" {...props} disabled={importing}>
                一括読み込み
              </Button>
            )}
          </FileButton>
          <Button
            variant="default"
            size="xs"
            onClick={exportBundle}
            loading={exporting}
            disabled={importing}
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
              <Button size="xs" onClick={handleConfirmImport} loading={importing}>
                実行する
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Paper>
  );
};
