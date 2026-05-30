"use client";

import {
  Affix,
  Alert,
  Button,
  Card,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import type { Character } from "@/types/character";
import type { PunishException } from "@/types/move";
import { asEnumValue } from "@/lib/optionGuards";
import { useExceptionsForm } from "./useExceptionsForm";

const ACTION_VALUES = ["exclude", "hit"] as const satisfies readonly PunishException["action"][];

const ACTION_OPTIONS: { value: PunishException["action"]; label: string }[] = [
  { value: "exclude", label: "除外（確定でも表示しない）" },
  { value: "hit", label: "強制表示（先端当てなど）" },
];

const toNumberOrUndefined = (value: number | string): number | undefined =>
  value === "" || typeof value !== "number" ? undefined : value;

export interface ExceptionsFormProps {
  characters: Character[];
  initialExceptions: PunishException[];
}

export const ExceptionsForm = ({
  characters,
  initialExceptions,
}: ExceptionsFormProps) => {
  const {
    exceptions,
    moveOptions,
    saving,
    feedback,
    addException,
    updateException,
    removeException,
    save,
  } = useExceptionsForm({ characters, initialExceptions });

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
        先端当ては「強制表示」を選び、硬直Fを上書き入力してください。
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
                    onChange={(value) => {
                      const action = asEnumValue(value, ACTION_VALUES, "exclude");
                      updateException(index, {
                        action,
                        recoveryOverride:
                          action === "hit" ? entry.recoveryOverride : undefined,
                      });
                    }}
                  />
                </SimpleGrid>
                {entry.action === "hit" && (
                  <NumberInput
                    label="硬直F（先端当て時の上書き）"
                    description="空欄なら技の通常硬直Fを使用"
                    min={0}
                    value={entry.recoveryOverride ?? ""}
                    onChange={(value) =>
                      updateException(index, {
                        recoveryOverride: toNumberOrUndefined(value),
                      })
                    }
                  />
                )}
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
          <Button size="md" onClick={save} loading={saving}>
            保存
          </Button>
        </Group>
      </Affix>
    </Stack>
  );
};
