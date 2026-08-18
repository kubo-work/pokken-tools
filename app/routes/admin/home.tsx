import { Paper, Group, Text, Title, Stack, Button } from "@mantine/core";
import type { Route } from "./+types/home";
import { getAllCharacters } from "@/lib/kv/getCharacters";
import { buildCharacterTiles } from "@/lib/characterTiles";
import { CharacterBundleIO } from "@/components/admin/CharacterBundleIO";

export async function loader() {
  const tiles = buildCharacterTiles(await getAllCharacters());
  return { tiles };
}

export default function AdminHomePage({ loaderData }: Route.ComponentProps) {
  const { tiles } = loaderData;

  return (
    <Stack gap="md">
      <Title order={2}>キャラ一覧</Title>
      <Text size="sm" c="dimmed">
        編集したいキャラを選択してください。キャラは固定で追加・削除はできません。
      </Text>
      <CharacterBundleIO />
      {tiles.map((tile) => (
        <Paper key={tile.id} withBorder p="md">
          <Group justify="space-between">
            <div>
              <Text fw={700}>{tile.name}</Text>
              <Text size="sm" c="dimmed" ff="monospace">
                {tile.id} / FP {tile.field} ・ DP {tile.duel} ・ 共通 {tile.common}
              </Text>
            </div>
            <Button
              variant="default"
              size="xs"
              component="a"
              href={`/admin/characters/${tile.id}`}
            >
              技を編集
            </Button>
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
