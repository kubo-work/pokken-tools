import type { Character } from "@/types/character";
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

export type { Feedback } from "@/lib/feedback";

export type UseCharacterEditorResult = UseCharacterStateResult &
  UseCharacterIOResult &
  UseCharacterSaveResult & {
    feedback: Feedback | undefined;
  };

/**
 * Character 編集 UI の集約 hook。
 * state / IO / save を 3 つの専用 hook に委譲し、UI 側に同じ interface を提供する。
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

  return {
    ...state,
    ...io,
    ...saveHook,
    feedback,
  };
};
