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
}

/** スキーマ違反で弾かれることが多いので、本文なしの失敗だけ入力確認を促す文言にする。 */
const SAVE_MESSAGES: SaveMessages = {
  ...DEFAULT_SAVE_MESSAGES,
  withoutDetail: "保存に失敗しました（入力内容を確認してください）",
};

/**
 * Character 編集内容を KV に保存する API 呼び出し。
 * 失敗時は HTTP body を feedback に展開して原因を出す（展開は adminApiClient 側の責務）。
 */
export const useCharacterSave = (
  character: Character,
  setFeedback: Dispatch<SetStateAction<Feedback | undefined>>,
): UseCharacterSaveResult => {
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setSaving(true);
    setFeedback(undefined);
    setFeedback(
      await saveWithFeedback(
        ADMIN_API_ENDPOINTS.character(character.id),
        character,
        SAVE_MESSAGES,
      ),
    );
    setSaving(false);
  };

  return { saving, save };
};
