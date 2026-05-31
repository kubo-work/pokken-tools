"use client";

import type { Dispatch, SetStateAction } from "react";
import type { Character } from "@/types/character";
import { characterSchema } from "@/lib/schema";
import type { Feedback } from "@/lib/feedback";

export interface UseCharacterIOResult {
  exportJson: () => void;
  importJson: (file: File | null) => Promise<void>;
}

/**
 * Character 編集状態の JSON 入出力を担当する hook。
 * インポート時の Zod 検証もここで完結し、結果を feedback として伝える。
 */
export const useCharacterIO = (
  character: Character,
  replaceCharacter: (next: Character) => void,
  setFeedback: Dispatch<SetStateAction<Feedback | undefined>>,
): UseCharacterIOResult => {
  const exportJson = (): void => {
    const blob = new Blob([JSON.stringify(character, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${character.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File | null): Promise<void> => {
    if (file === null) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = characterSchema.safeParse(parsed);
      if (!result.success) {
        const detail = result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(" / ");
        setFeedback({ ok: false, message: `JSONの内容が不正です: ${detail}` });
        return;
      }
      if (result.data.id !== character.id) {
        setFeedback({
          ok: false,
          message: `ID不一致。期待: ${character.id} / 実際: ${result.data.id}`,
        });
        return;
      }
      replaceCharacter(result.data);
      setFeedback({ ok: true, message: "読み込みました（保存ボタンで反映）" });
    } catch (error) {
      console.error("character JSON import failed", error);
      const message = error instanceof Error ? error.message : String(error);
      setFeedback({
        ok: false,
        message: `JSONのパースに失敗しました: ${message}`,
      });
    }
  };

  return { exportJson, importJson };
};
