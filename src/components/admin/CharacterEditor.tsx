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
import { groupMovesByParent } from "@/lib/moves/grouping";
import { MoveEditor } from "./MoveEditor";
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  /**
   * 親 / 子 を id ベースで判別して並び替える。
   * - 親同士のドラッグ: 親グループ単位で移動（子もまとめて）
   * - 子同士のドラッグ: 同じ親内のときだけ移動。親をまたぐ並び替えは黙って無視
   */
  const handleDragEnd = (phase: Phase, event: DragEndEvent): void => {
    const { active, over } = event;
    if (over === null || active.id === over.id) {
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    const groups = groupMovesByParent(getPhaseMoves(phase));

    const fromParentIndex = groups.findIndex(
      (group) => group.parent.id === activeId,
    );
    const toParentIndex = groups.findIndex(
      (group) => group.parent.id === overId,
    );
    if (fromParentIndex !== -1 && toParentIndex !== -1) {
      reorderParents(phase, fromParentIndex, toParentIndex);
      return;
    }

    const findChild = (id: string) => {
      for (const group of groups) {
        const childIndex = group.children.findIndex(
          (child) => child.id === id,
        );
        if (childIndex !== -1) {
          return { parentId: group.parent.id, childIndex };
        }
      }
      return undefined;
    };
    const activeChild = findChild(activeId);
    const overChild = findChild(overId);
    if (
      activeChild !== undefined &&
      overChild !== undefined &&
      activeChild.parentId === overChild.parentId
    ) {
      reorderChildren(
        phase,
        activeChild.parentId,
        activeChild.childIndex,
        overChild.childIndex,
      );
    }
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
          const groups = groupMovesByParent(moves);
          const findMoveIndex = (id: string): number =>
            moves.findIndex((move) => move.id === id);
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
                    onClick={() => addParentMove(phase)}
                  >
                    技を追加
                  </Button>
                </Group>
                {groups.length === 0 ? (
                  <Text c="dimmed" size="sm">
                    技がありません。
                  </Text>
                ) : (
                  <DndContext
                    id={`character-${character.id}-${phase}-dnd`}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(phase, event)}
                  >
                    <SortableContext
                      items={groups.map((group) => group.parent.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Stack gap="sm">
                        {groups.map((group, groupIndex) => {
                          const parentIndex = findMoveIndex(group.parent.id);
                          return (
                            <MoveEditor
                              key={group.parent.id}
                              move={group.parent}
                              index={groupIndex}
                              childMoves={group.children}
                              onChange={(updated) =>
                                updateMove(phase, parentIndex, updated)
                              }
                              onRemove={() =>
                                removeParentGroup(phase, group.parent.id)
                              }
                              onChildChange={(childId, updatedChild) => {
                                const childIndex = findMoveIndex(childId);
                                if (childIndex === -1) return;
                                updateMove(phase, childIndex, updatedChild);
                              }}
                              onChildRemove={(childId) =>
                                removeChildMove(phase, group.parent.id, childId)
                              }
                              onAddCharge={() =>
                                addChildMove(phase, group.parent.id, "charge")
                              }
                              onAddDerivative={() =>
                                addChildMove(
                                  phase,
                                  group.parent.id,
                                  "derivative",
                                )
                              }
                            />
                          );
                        })}
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
