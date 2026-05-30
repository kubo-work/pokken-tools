"use client";

import Link from "next/link";
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
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Character } from "@/types/character";
import type { Phase } from "@/types/move";
import { PHASES, PHASE_META } from "@/lib/meta";
import { MoveEditor } from "./MoveEditor";
import { useCharacterEditor } from "./useCharacterEditor";

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
    addMove,
    removeMove,
    reorderMoves,
    exportJson,
    importJson,
    save,
    getPhaseMoves,
  } = useCharacterEditor(initial);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (phase: Phase, event: DragEndEvent): void => {
    const { active, over } = event;
    if (over === null || active.id === over.id) {
      return;
    }
    const moves = getPhaseMoves(phase);
    const fromIndex = moves.findIndex((move) => move.id === active.id);
    const toIndex = moves.findIndex((move) => move.id === over.id);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    reorderMoves(phase, fromIndex, toIndex);
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
          <Button variant="default" size="xs" component={Link} href="/admin">
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

        {PHASES.map((phase) => {
          const moves = getPhaseMoves(phase);
          return (
            <Tabs.Panel key={phase} value={phase} pt="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Title order={4} c="dimmed">
                    {PHASE_META[phase].label}
                  </Title>
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() => addMove(phase)}
                  >
                    技を追加
                  </Button>
                </Group>
                {moves.length === 0 ? (
                  <Text c="dimmed" size="sm">
                    技がありません。
                  </Text>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(phase, event)}
                  >
                    <SortableContext
                      items={moves.map((move) => move.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Stack gap="sm">
                        {moves.map((move, index) => (
                          <MoveEditor
                            key={move.id}
                            move={move}
                            index={index}
                            onChange={(updated) =>
                              updateMove(phase, index, updated)
                            }
                            onRemove={() => removeMove(phase, index)}
                          />
                        ))}
                      </Stack>
                    </SortableContext>
                  </DndContext>
                )}
              </Stack>
            </Tabs.Panel>
          );
        })}
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
