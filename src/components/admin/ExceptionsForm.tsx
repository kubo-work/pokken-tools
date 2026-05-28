"use client";

import { useState } from "react";
import {
  Affix,
  Alert,
  Button,
  Card,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { PHASE_META } from "@/lib/meta";
import type { Character } from "@/types/character";
import type { Phase, PunishException } from "@/types/move";

const PHASES: Phase[] = ["duel", "field"];

const ACTION_OPTIONS = [
  { value: "exclude", label: "除外（確定でも表示しない）" },
  { value: "hit", label: "強制表示（不利でも表示）" },
];

interface MoveOption {
  value: string;
  label: string;
}

function buildMoveOptions(characters: Character[]): MoveOption[] {
  const options: MoveOption[] = [];
  for (const character of characters) {
    for (const phase of PHASES) {
      const moves = phase === "field" ? character.fieldMoves : character.duelMoves;
      for (const move of moves) {
        options.push({
          value: move.id,
          label: `${character.name} / ${move.name}（${move.command}）[${PHASE_META[phase].shortLabel}]`,
        });
      }
    }
  }
  return options;
}

export function ExceptionsForm({
  characters,
  initialExceptions,
}: {
  characters: Character[];
  initialExceptions: PunishException[];
}) {
  const moveOptions = buildMoveOptions(characters);
  const [exceptions, setExceptions] = useState<PunishException[]>(initialExceptions);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { ok: boolean; message: string } | undefined
  >(undefined);

  function updateException(index: number, patch: Partial<PunishException>) {
    setExceptions((current) =>
      current.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    );
  }

  function addException() {
    const firstMoveId = moveOptions.at(0)?.value ?? "";
    setExceptions((current) => [
      ...current,
      { attackerMoveId: firstMoveId, defenderMoveId: firstMoveId, action: "exclude" },
    ]);
  }

  function removeException(index: number) {
    setExceptions((current) =>
      current.filter((_entry, position) => position !== index),
    );
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(undefined);
    const response = await fetch("/api/admin/exceptions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exceptions),
    });
    setSaving(false);
    setFeedback(
      response.ok
        ? { ok: true, message: "保存しました" }
        : { ok: false, message: "保存に失敗しました" },
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>確定反撃の例外設定</Title>
        <Button variant="light" size="xs" onClick={addException}>
          例外を追加
        </Button>
      </Group>

      <Text size="sm" c="dimmed">
        フレーム計算では表現できないノックバック・先端当てを上書きします。登録したペアにのみ適用され、
        既定は「除外」です。「強制表示」はフレーム上不利でも反撃として表示します。
      </Text>

      {exceptions.length === 0 ? (
        <Text c="dimmed">例外はありません。</Text>
      ) : (
        <Stack gap="sm">
          {exceptions.map((entry, index) => (
            <Card key={index} withBorder padding="md">
              <Stack gap="sm">
                <SimpleGrid cols={{ base: 1, sm: 3 }}>
                  <Select
                    label="攻撃側（ガードした技）"
                    searchable
                    data={moveOptions}
                    value={entry.attackerMoveId}
                    onChange={(value) =>
                      updateException(index, { attackerMoveId: value ?? "" })
                    }
                  />
                  <Select
                    label="防御側（反撃技）"
                    searchable
                    data={moveOptions}
                    value={entry.defenderMoveId}
                    onChange={(value) =>
                      updateException(index, { defenderMoveId: value ?? "" })
                    }
                  />
                  <Select
                    label="動作"
                    allowDeselect={false}
                    data={ACTION_OPTIONS}
                    value={entry.action}
                    onChange={(value) =>
                      updateException(index, {
                        action: (value ?? "exclude") as PunishException["action"],
                      })
                    }
                  />
                </SimpleGrid>
                <Group align="flex-end" gap="sm">
                  <TextInput
                    label="備考"
                    style={{ flex: 1 }}
                    value={entry.note ?? ""}
                    onChange={(event) =>
                      updateException(index, {
                        note:
                          event.currentTarget.value === ""
                            ? undefined
                            : event.currentTarget.value,
                      })
                    }
                  />
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    onClick={() => removeException(index)}
                  >
                    削除
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}

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
