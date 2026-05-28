"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Affix,
  Alert,
  Button,
  Code,
  FileButton,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import type { Character } from "@/types/character";
import type { Move, Phase } from "@/types/move";
import { PHASE_META } from "@/lib/meta";
import { createMove } from "@/lib/factory";
import { characterSchema } from "@/lib/schema";
import { MoveEditor } from "./MoveEditor";

const PHASES: Phase[] = ["duel", "field"];

function getPhaseMoves(character: Character, phase: Phase): Move[] {
  return phase === "field" ? character.fieldMoves : character.duelMoves;
}

function withPhaseMoves(character: Character, phase: Phase, moves: Move[]): Character {
  return phase === "field"
    ? { ...character, fieldMoves: moves }
    : { ...character, duelMoves: moves };
}

/**
 * 1キャラの編集UI。
 * - import: JSON ファイルを Zod で検証して上書き
 * - export: 現在の編集中状態を JSON ダウンロード
 * - 保存: PUT /api/admin/characters/{id} で KV に書き込む
 */
export function CharacterEditor({ initial }: { initial: Character }) {
  const [character, setCharacter] = useState<Character>(initial);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { ok: boolean; message: string } | undefined
  >(undefined);
  const downloadAnchorRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    setCharacter(initial);
  }, [initial]);

  function updateMove(phase: Phase, index: number, move: Move) {
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        getPhaseMoves(current, phase).map((entry, position) =>
          position === index ? move : entry,
        ),
      ),
    );
  }

  function addMove(phase: Phase) {
    setCharacter((current) =>
      withPhaseMoves(current, phase, [
        ...getPhaseMoves(current, phase),
        createMove(current.id, phase),
      ]),
    );
  }

  function removeMove(phase: Phase, index: number) {
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        getPhaseMoves(current, phase).filter((_move, position) => position !== index),
      ),
    );
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(character, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${character.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File | null) {
    if (file === null) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = characterSchema.safeParse(parsed);
      if (!result.success) {
        setFeedback({ ok: false, message: "JSONの内容が不正です" });
        return;
      }
      if (result.data.id !== character.id) {
        setFeedback({
          ok: false,
          message: `ID不一致。期待: ${character.id} / 実際: ${result.data.id}`,
        });
        return;
      }
      setCharacter(result.data);
      setFeedback({ ok: true, message: "読み込みました（保存ボタンで反映）" });
    } catch {
      setFeedback({ ok: false, message: "JSONのパースに失敗しました" });
    }
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(undefined);
    const response = await fetch(`/api/admin/characters/${character.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(character),
    });
    setSaving(false);
    setFeedback(
      response.ok
        ? { ok: true, message: "保存しました" }
        : { ok: false, message: "保存に失敗しました（入力内容を確認してください）" },
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>{character.name} を編集</Title>
        <Group gap="xs">
          <FileButton onChange={handleImport} accept="application/json">
            {(props) => (
              <Button variant="default" size="xs" {...props}>
                JSON読み込み
              </Button>
            )}
          </FileButton>
          <Button variant="default" size="xs" onClick={handleExport}>
            JSON書き出し
          </Button>
          <Button variant="default" size="xs" component={Link} href="/admin">
            一覧へ戻る
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="キャラ名"
            value={character.name}
            onChange={(event) =>
              setCharacter({ ...character, name: event.currentTarget.value })
            }
          />
          <TextInput
            label="肩書き（任意）"
            value={character.title ?? ""}
            onChange={(event) =>
              setCharacter({
                ...character,
                title:
                  event.currentTarget.value === ""
                    ? undefined
                    : event.currentTarget.value,
              })
            }
          />
        </SimpleGrid>
        <Text size="sm" c="dimmed" mt="sm">
          ID: <Code>{character.id}</Code>（変更不可）
        </Text>
      </Paper>

      {PHASES.map((phase) => {
        const moves = getPhaseMoves(character, phase);
        return (
          <Stack key={phase} gap="sm">
            <Group justify="space-between">
              <Title order={4} c="dimmed">
                {PHASE_META[phase].label}（{moves.length}技）
              </Title>
              <Button variant="light" size="xs" onClick={() => addMove(phase)}>
                技を追加
              </Button>
            </Group>
            {moves.length === 0 ? (
              <Text c="dimmed" size="sm">
                技がありません。
              </Text>
            ) : (
              moves.map((move, index) => (
                <MoveEditor
                  key={move.id}
                  move={move}
                  index={index}
                  onChange={(updated) => updateMove(phase, index, updated)}
                  onRemove={() => removeMove(phase, index)}
                />
              ))
            )}
          </Stack>
        );
      })}

      <a ref={downloadAnchorRef} style={{ display: "none" }} />

      <Affix position={{ bottom: 20, right: 20 }}>
        <Group gap="sm">
          {feedback !== undefined && (
            <Alert color={feedback.ok ? "teal" : "red"} py={6} px="md">
              {feedback.message}
            </Alert>
          )}
          <Button size="md" onClick={handleSave} loading={saving}>
            保存
          </Button>
        </Group>
      </Affix>
    </Stack>
  );
}
