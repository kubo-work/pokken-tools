import type { Dispatch, SetStateAction } from "react";
import type { Character } from "@/types/character";
import { characterSchema } from "@/lib/schema";
import type { Feedback } from "@/lib/feedback";
import { formatIssues } from "@/lib/admin/formatIssues";
import { readJsonFile } from "@/lib/admin/readJsonFile";

export interface UseCharacterIOResult {
  exportJson: () => void;
  importJson: (file: File | null) => Promise<void>;
}

/**
 * Character 編集状態の JSON 入出力を担当する hook。
 * インポート時は readJsonFile で UTF-8 の妥当性を検証したうえで characterSchema による
 * Zod 検証を行い、結果を feedback として伝える。
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
    const read = await readJsonFile(file);
    if (!read.ok) {
      setFeedback({ ok: false, message: read.message });
      return;
    }
    const result = characterSchema.safeParse(read.value);
    if (!result.success) {
      console.error("character JSON validation failed", result.error.issues);
      const detail = formatIssues(result.error.issues);
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
  };

  return { exportJson, importJson };
};
