"use client";

import { Link } from "react-router";
import {
  Affix,
  Alert,
  Button,
  Code,
  FileButton,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import type { Character } from "@/types/character";
import { ACCENT_BORDER } from "@/lib/admin/surfaceTokens";
import { PHASES, PHASE_META } from "@/lib/meta";
import { PhaseMoveEditor, type PhaseMoveActions } from "./PhaseMoveEditor";
import { useCharacterEditor } from "@/hooks/admin/useCharacterEditor";

/**
 * 1キャラの編集UI。
 * - import: JSON ファイルを Zod で検証して上書き
 * - export: 現在の編集中状態を JSON ダウンロード
 * - 保存: PUT /api/admin/characters/{id} で KV に書き込む
 */
export const CharacterEditor = ({ initial }: { initial: Character }) => {
  const {
    character,
    saving,
    feedback,
    setCharacterName,
    updateMove,
    addParentMove,
    addChildMove,
    removeParentGroup,
    removeChildMove,
    reorderParents,
    reorderChildren,
    exportJson,
    importJson,
    save,
    getPhaseMoves,
  } = useCharacterEditor(initial);

  const moveActions: PhaseMoveActions = {
    updateMove,
    addParentMove,
    addChildMove,
    removeParentGroup,
    removeChildMove,
    reorderParents,
    reorderChildren,
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>{character.name} を編集</Title>
        <Group gap="xs">
          <FileButton onChange={importJson} accept="application/json">
            {(props) => (
              <Button variant="default" size="xs" {...props}>
                JSON読み込み
              </Button>
            )}
          </FileButton>
          <Button variant="default" size="xs" onClick={exportJson}>
            JSON書き出し
          </Button>
          <Button variant="default" size="xs" component={Link} to="/admin">
            一覧へ戻る
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md">
        <TextInput
          label="キャラ名"
          value={character.name}
          onChange={(event) => setCharacterName(event.currentTarget.value)}
        />
        <Text size="sm" c="dimmed" mt="sm">
          ID: <Code>{character.id}</Code>（変更不可）
        </Text>
      </Paper>

      <Tabs defaultValue={PHASES[0]} keepMounted={false}>
        <Tabs.List>
          {PHASES.map((phase) => (
            <Tabs.Tab key={phase} value={phase}>
              {PHASE_META[phase].shortLabel}（{getPhaseMoves(phase).length}技）
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {PHASES.map((phase) => (
          <Tabs.Panel key={phase} value={phase} pt="md">
            <Stack gap="sm">
              <Title
                order={4}
                style={{ borderLeft: ACCENT_BORDER, paddingLeft: 10 }}
              >
                {PHASE_META[phase].label}
              </Title>
              <PhaseMoveEditor
                phase={phase}
                moves={getPhaseMoves(phase)}
                moveActions={moveActions}
              />
            </Stack>
          </Tabs.Panel>
        ))}
      </Tabs>

      <Affix position={{ bottom: 20, right: 20 }}>
        <Group gap="sm">
          {feedback !== undefined && (
            <Alert color={feedback.ok ? "teal" : "red"} py={6} px="md">
              {feedback.message}
            </Alert>
          )}
          <Button size="md" onClick={save} loading={saving}>
            保存
          </Button>
        </Group>
      </Affix>
    </Stack>
  );
};
