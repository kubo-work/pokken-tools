import { useState, type Dispatch, type SetStateAction } from "react";
import type { Character } from "@/types/character";
import type { Feedback } from "@/lib/feedback";
import {
  DEFAULT_SAVE_MESSAGES,
  saveWithFeedback,
  type SaveMessages,
} from "@/lib/admin/adminApiClient";
import { ADMIN_API_ENDPOINTS } from "@/lib/admin/endpoints";

export interface UseCharacterSaveResult {
  saving: boolean;
  save: () => Promise<void>;
  /** 最後に保存に成功した内容。未保存の変更の有無を判定する基準に使う。 */
  lastSavedCharacter: Character;
}

/** スキーマ違反で弾かれることが多いので、本文なしの失敗だけ入力確認を促す文言にする。 */
const SAVE_MESSAGES: SaveMessages = {
  ...DEFAULT_SAVE_MESSAGES,
  withoutDetail: "保存に失敗しました（入力内容を確認してください）",
};

/**
 * Character 編集内容を KV に保存する API 呼び出し。
 * 失敗時は HTTP body を feedback に展開して原因を出す（展開は adminApiClient 側の責務）。
 * 成功時は送信した内容を lastSavedCharacter に記録する（保存中に続けた編集は未保存のまま
 * 残すため、完了時点ではなく送信時点の character を記録する）。
 */
export const useCharacterSave = (
  character: Character,
  setFeedback: Dispatch<SetStateAction<Feedback | undefined>>,
): UseCharacterSaveResult => {
  const [saving, setSaving] = useState(false);
  // 初期値は初回描画時の character（= KV から読み込んだ内容）。別キャラへの遷移時は
  // 呼び出し元が key の付け替えで再マウントするため、ここで props を同期しなくてよい。
  const [lastSavedCharacter, setLastSavedCharacter] =
    useState<Character>(character);

  const save = async (): Promise<void> => {
    const submittedCharacter = character;
    setSaving(true);
    setFeedback(undefined);
    const feedback = await saveWithFeedback(
      ADMIN_API_ENDPOINTS.character(submittedCharacter.id),
      submittedCharacter,
      SAVE_MESSAGES,
    );
    setFeedback(feedback);
    if (feedback.ok) {
      setLastSavedCharacter(submittedCharacter);
    }
    setSaving(false);
  };

  return { saving, save, lastSavedCharacter };
};
