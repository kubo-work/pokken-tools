import type { Blocker } from "react-router";
import type { Character } from "@/types/character";
import { isSameCharacter } from "@/lib/admin/isSameCharacter";
import { useCharacterIO, type UseCharacterIOResult } from "./useCharacterIO";
import {
  useCharacterSave,
  type UseCharacterSaveResult,
} from "./useCharacterSave";
import {
  useCharacterState,
  type UseCharacterStateResult,
} from "./useCharacterState";
import type { Feedback } from "@/lib/feedback";
import { useAutoDismissedFeedback } from "./useAutoDismissedFeedback";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

export type { Feedback } from "@/lib/feedback";

export type UseCharacterEditorResult = UseCharacterStateResult &
  UseCharacterIOResult &
  UseCharacterSaveResult & {
    feedback: Feedback | undefined;
    /** 未保存の変更がある状態でのアプリ内遷移を止める。state が "blocked" の間に確認 UI を出す。 */
    navigationBlocker: Blocker;
  };

/**
 * Character 編集 UI の集約 hook。
 * state / IO / save を 3 つの専用 hook に委譲し、UI 側に同じ interface を提供する。
 * 保存済みの内容を基準に未保存の変更を判定し、離脱時の確認も担う。
 */
export const useCharacterEditor = (
  initial: Character,
): UseCharacterEditorResult => {
  const { feedback, setFeedback } = useAutoDismissedFeedback();
  const state = useCharacterState(initial);
  const io = useCharacterIO(
    state.character,
    state.replaceCharacter,
    setFeedback,
  );
  const saveHook = useCharacterSave(state.character, setFeedback);
  // 基準は保存成功時だけ更新される。JSON 読み込みは KV に反映されないため未保存の変更として扱う。
  const hasUnsavedChanges = !isSameCharacter(
    state.character,
    saveHook.lastSavedCharacter,
  );
  const navigationBlocker = useUnsavedChangesGuard(hasUnsavedChanges);

  return {
    ...state,
    ...io,
    ...saveHook,
    feedback,
    navigationBlocker,
  };
};
