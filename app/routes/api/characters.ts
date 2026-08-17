import type { Route } from "./+types/characters";
import { requireApiUser } from "@/auth/session.server";
import { getAllCharacters } from "@/lib/kv/getCharacters";
import { getExceptions, setExceptions } from "@/lib/kv/exceptions";
import { setCharacter } from "@/lib/kv/setCharacter";
import { characterBundleSchema } from "@/lib/schema";
import { parseJsonBody } from "@/lib/parseJsonBody";
import type { Character } from "@/types/character";

/**
 * 全キャラ + 例外設定のエクスポート(GET)。resource route。
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  await requireApiUser(request);
  const [characters, exceptions] = await Promise.all([
    getAllCharacters(),
    getExceptions(),
  ]);
  return Response.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    characters,
    exceptions,
  });
};

interface CharacterSaveSettlement {
  id: string;
  ok: boolean;
}

/**
 * キャラごとに別 KV キーのため真のトランザクションが張れない。
 * allSettled でキャラごとの成否を個別に記録し、失敗分を呼び出し側へ伝える。
 */
const saveCharacters = async (
  characters: Character[],
): Promise<CharacterSaveSettlement[]> => {
  const settlements = await Promise.allSettled(
    characters.map((character) => setCharacter(character)),
  );
  return settlements.map((settlement, index) => ({
    id: characters[index].id,
    ok: settlement.status === "fulfilled",
  }));
};

/**
 * 全キャラ + 例外設定の一括保存(PUT)。resource route。
 * characterBundleSchema の検証を全件通してから書き込みに入るため、検証エラー時は KV に触れない。
 * ファイルに含まれないキャラは据え置く（含まれる分だけ更新）。
 */
export const action = async ({ request }: Route.ActionArgs) => {
  await requireApiUser(request);

  if (request.method !== "PUT") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const bundle = await parseJsonBody(request, characterBundleSchema);

  const settlements = await saveCharacters(bundle.characters);
  const savedCharacterIds = settlements
    .filter((settlement) => settlement.ok)
    .map((settlement) => settlement.id);
  const failedCharacterIds = settlements
    .filter((settlement) => !settlement.ok)
    .map((settlement) => settlement.id);

  if (failedCharacterIds.length > 0) {
    console.error("character bundle save partially failed", failedCharacterIds);
    return Response.json(
      {
        error: `一部のキャラの保存に失敗しました: ${failedCharacterIds.join(", ")}`,
        savedCharacterIds,
        failedCharacterIds,
      },
      { status: 500 },
    );
  }

  if (bundle.exceptions !== undefined) {
    try {
      await setExceptions(bundle.exceptions);
    } catch (error) {
      console.error("exceptions save failed", error);
      return Response.json(
        {
          error: "例外設定の保存に失敗しました",
          savedCharacterIds,
          exceptionsApplied: false,
        },
        { status: 500 },
      );
    }
  }

  return Response.json({
    ok: true,
    savedCharacterIds,
    exceptionsApplied: bundle.exceptions !== undefined,
  });
};
