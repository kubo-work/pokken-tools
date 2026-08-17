import type { Route } from "./+types/characters";
import { requireApiUser } from "@/auth/session.server";
import { getAllCharacters } from "@/lib/kv/getCharacters";
import { getExceptions, setExceptions } from "@/lib/kv/exceptions";
import { setCharacter } from "@/lib/kv/setCharacter";
import {
  CHARACTER_BUNDLE_VERSION,
  characterBundleSchema,
} from "@/lib/schema";
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
  return Response.json(
    {
      version: CHARACTER_BUNDLE_VERSION,
      exportedAt: new Date().toISOString(),
      characters,
      exceptions,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
};

interface CharacterSaveSettlement {
  id: string;
  ok: boolean;
  /** rejected 時の理由。ログ用途のみで、HTTP レスポンスには含めない。 */
  reason?: unknown;
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
    reason: settlement.status === "rejected" ? settlement.reason : undefined,
  }));
};

/**
 * 部分失敗を理由付きでログに残す。observability 有効時はこのログが障害時の唯一の記録になるため、
 * どのキャラがどう失敗したか（KV のクォータ超過か一時障害か）を判別できる情報を残す。
 */
const logPartialFailure = (
  failedSettlements: CharacterSaveSettlement[],
): void => {
  console.error(
    "character bundle save partially failed",
    failedSettlements.map((settlement) => ({
      id: settlement.id,
      reason: settlement.reason,
    })),
  );
};

/**
 * 一部のキャラだけ保存に失敗したときの 500 応答本文。
 * 失敗理由（reason）は含めない。内部エラーの詳細をクライアントへ漏らさないため。
 */
const buildPartialFailureBody = (
  savedCharacterIds: string[],
  failedCharacterIds: string[],
) => ({
  error:
    `一部のキャラの保存に失敗しました。保存済み ${savedCharacterIds.length} 件 / ` +
    `失敗 ${failedCharacterIds.length} 件（${failedCharacterIds.join(", ")}）。` +
    "もう一度実行すれば再試行できます",
  savedCharacterIds,
  failedCharacterIds,
});

/**
 * 例外設定の保存に失敗したときの 500 応答本文。
 * この分岐に来るのはキャラが全件保存済みのときだけなので failedCharacterIds は空配列。
 */
const buildExceptionsFailureBody = (savedCharacterIds: string[]) => ({
  error: "例外設定の保存に失敗しました",
  savedCharacterIds,
  failedCharacterIds: [],
  exceptionsApplied: false,
});

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
  const failedSettlements = settlements.filter((settlement) => !settlement.ok);
  const failedCharacterIds = failedSettlements.map(
    (settlement) => settlement.id,
  );
  const savedCharacterIds = settlements
    .filter((settlement) => settlement.ok)
    .map((settlement) => settlement.id);

  if (failedCharacterIds.length > 0) {
    // ここで return するため setExceptions には到達しない。exceptions は全キャラ共有の
    // 単一 KV キーのため、一部キャラの保存に失敗した状態のまま一緒に上書きすると
    // 「どのキャラの状態と対応する exceptions なのか」が分からなくなる。
    logPartialFailure(failedSettlements);
    return Response.json(
      buildPartialFailureBody(savedCharacterIds, failedCharacterIds),
      { status: 500 },
    );
  }

  if (bundle.exceptions !== undefined) {
    try {
      await setExceptions(bundle.exceptions);
    } catch (error) {
      console.error("exceptions save failed", error);
      return Response.json(buildExceptionsFailureBody(savedCharacterIds), {
        status: 500,
      });
    }
  }

  return Response.json({
    ok: true,
    savedCharacterIds,
    exceptionsApplied: bundle.exceptions !== undefined,
  });
};
