import { Paper, Group, Text, Title, Stack, Button } from "@mantine/core";
import { CHARACTER_REGISTRY } from "@/lib/characters/registry";
import { getAllCharacters } from "@/lib/kv/getCharacters";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const characters = await getAllCharacters();
  const countsById = new Map(
    characters.map((character) => [
      character.id,
      { field: character.fieldMoves.length, duel: character.duelMoves.length },
    ]),
  );

  return (
    <Stack gap="md">
      <Title order={2}>キャラ一覧</Title>
      <Text size="sm" c="dimmed">
        編集したいキャラを選択してください。キャラは固定で追加・削除はできません。
      </Text>
      {CHARACTER_REGISTRY.map((entry) => {
        const counts = countsById.get(entry.id) ?? { field: 0, duel: 0 };
        return (
          <Paper key={entry.id} withBorder p="md">
            <Group justify="space-between">
              <div>
                <Text fw={700}>{entry.name}</Text>
                <Text size="sm" c="dimmed" ff="monospace">
                  {entry.id} / FP {counts.field} ・ DP {counts.duel}
                </Text>
              </div>
              <Button variant="default" size="xs" component="a" href={`/admin/characters/${entry.id}`}>
                技を編集
              </Button>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
