"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { Character } from "@/types/character";
import type { Feedback } from "@/lib/feedback";

export interface UseCharacterSaveResult {
  saving: boolean;
  save: () => Promise<void>;
}

/**
 * Character 編集内容を KV に保存する API 呼び出し。
 * 失敗時は HTTP body を feedback に展開して原因を出す。
 */
export const useCharacterSave = (
  character: Character,
  setFeedback: Dispatch<SetStateAction<Feedback | undefined>>,
): UseCharacterSaveResult => {
  const [saving, setSaving] = useState(false);

  const save = async (): Promise<void> => {
    setSaving(true);
    setFeedback(undefined);
    try {
      const response = await fetch(`/api/admin/characters/${character.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(character),
      });
      if (response.ok) {
        setFeedback({ ok: true, message: "保存しました" });
        return;
      }
      const detail = await response.text().catch(() => "");
      setFeedback({
        ok: false,
        message:
          detail === ""
            ? "保存に失敗しました（入力内容を確認してください）"
            : `保存に失敗しました: ${detail}`,
      });
    } catch (error) {
      console.error("character save failed", error);
      const message = error instanceof Error ? error.message : String(error);
      setFeedback({ ok: false, message: `通信エラー: ${message}` });
    } finally {
      setSaving(false);
    }
  };

  return { saving, save };
};
