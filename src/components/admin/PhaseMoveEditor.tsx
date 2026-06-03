"use client";

import { useState } from "react";
import { Box, Flex, Paper, Text } from "@mantine/core";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SURFACE } from "@/lib/admin/surfaceTokens";
import { groupMovesByParent } from "@/lib/moves/grouping";
import type { Move, Phase } from "@/types/move";
import type { UseCharacterStateResult } from "@/hooks/admin/useCharacterState";
import { usePhaseMoveDnd } from "@/hooks/admin/usePhaseMoveDnd";
import { ChildMoveList } from "./ChildMoveList";
import { MoveEditor } from "./MoveEditor";
import { MoveList } from "./MoveList";

/** PhaseMoveEditor が必要とする技操作群。state hook の戻り値型を再利用して重複定義を避ける。 */
export type PhaseMoveActions = Pick<
  UseCharacterStateResult,
  | "updateMove"
  | "addParentMove"
  | "addChildMove"
  | "removeParentGroup"
  | "removeChildMove"
  | "reorderParents"
  | "reorderChildren"
>;

export interface PhaseMoveEditorProps {
  phase: Phase;
  /** このフェイズのフラットな技配列（親 → 子の順）。 */
  moves: Move[];
  moveActions: PhaseMoveActions;
}

/**
 * 1 フェイズ分の技編集をマスターディテール構成で表示する。
 * - 左: コンパクトな技一覧（並び替え・選択）
 * - 右: 選択中の技だけをフル編集
 * これにより一覧が短く保たれ、並び替え時のスクロール距離が短くなる。
 */
export const PhaseMoveEditor = ({
  phase,
  moves,
  moveActions,
}: PhaseMoveEditorProps) => {
  const {
    updateMove,
    addParentMove,
    addChildMove,
    removeParentGroup,
    removeChildMove,
    reorderParents,
    reorderChildren,
  } = moveActions;
  const groups = groupMovesByParent(moves);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(
    undefined,
  );

  // 選択は「ユーザーが選んだ id」だけを state に持つ。表示は groups から導出し、
  // 削除・未選択で id が見つからないときは先頭にフォールバックする（effect での state 同期を避ける）。
  const selectedGroup =
    groups.find((group) => group.parent.id === selectedParentId) ?? groups[0];

  const { sensors, handleDragEnd } = usePhaseMoveDnd({
    phase,
    groups,
    reorderParents,
    reorderChildren,
  });

  const findMoveIndex = (id: string): number =>
    moves.findIndex((move) => move.id === id);

  const handleAdd = (): void => {
    setSelectedParentId(addParentMove(phase));
  };

  return (
    <DndContext
      id={`character-${phase}-dnd`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Flex gap="md" align="flex-start" wrap="wrap">
        <Box
          style={{
            flex: "1 1 260px",
            maxWidth: 360,
            position: "sticky",
            top: 16,
          }}
        >
          <MoveList
            groups={groups}
            selectedParentId={selectedGroup?.parent.id}
            onSelect={setSelectedParentId}
            onAdd={handleAdd}
          />
        </Box>
        <Box style={{ flex: "999 1 380px", minWidth: 0 }}>
          {selectedGroup === undefined ? (
            <Paper withBorder p="xl">
              <Text c="dimmed" ta="center">
                左の一覧から技を選択、または「技を追加」してください。
              </Text>
            </Paper>
          ) : (
            <MoveEditor
              move={selectedGroup.parent}
              index={groups.indexOf(selectedGroup)}
              isChild={false}
              rootBg={SURFACE.card}
              onChange={(updated) =>
                updateMove(
                  phase,
                  findMoveIndex(selectedGroup.parent.id),
                  updated,
                )
              }
              onRemove={() =>
                removeParentGroup(phase, selectedGroup.parent.id)
              }
            >
              <ChildMoveList
                childMoves={selectedGroup.children}
                onChildChange={(childId, updatedChild) => {
                  const childIndex = findMoveIndex(childId);
                  if (childIndex === -1) return;
                  updateMove(phase, childIndex, updatedChild);
                }}
                onChildRemove={(childId) =>
                  removeChildMove(phase, selectedGroup.parent.id, childId)
                }
                onAddCharge={() =>
                  addChildMove(phase, selectedGroup.parent.id, "charge")
                }
                onAddDerivative={() =>
                  addChildMove(phase, selectedGroup.parent.id, "derivative")
                }
              />
            </MoveEditor>
          )}
        </Box>
      </Flex>
    </DndContext>
  );
};
