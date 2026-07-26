import { useState } from "react";
import { PHASES, PHASE_META } from "@/lib/meta";
import type { Character } from "@/types/character";
import type { PunishException } from "@/types/move";
import type { Feedback } from "@/lib/feedback";
import { saveWithFeedback } from "@/lib/admin/adminApiClient";
import { ADMIN_API_ENDPOINTS } from "@/lib/admin/endpoints";
import { useAutoDismissedFeedback } from "./useAutoDismissedFeedback";

export interface MoveOption {
  value: string;
  label: string;
}

const buildMoveOptions = (characters: Character[]): MoveOption[] => {
  const options: MoveOption[] = [];
  for (const character of characters) {
    for (const phase of PHASES) {
      const moves =
        phase === "field" ? character.fieldMoves : character.duelMoves;
      for (const move of moves) {
        options.push({
          value: move.id,
          label: `${character.name} / ${move.name}（${move.command}）[${PHASE_META[phase].shortLabel}]`,
        });
      }
    }
  }
  return options;
};

export interface UseExceptionsFormParams {
  characters: Character[];
  initialExceptions: PunishException[];
}

export interface UseExceptionsFormResult {
  exceptions: PunishException[];
  moveOptions: MoveOption[];
  saving: boolean;
  feedback: Feedback | undefined;
  addException: () => void;
  updateException: (index: number, patch: Partial<PunishException>) => void;
  removeException: (index: number) => void;
  save: () => Promise<void>;
}

export const useExceptionsForm = ({
  characters,
  initialExceptions,
}: UseExceptionsFormParams): UseExceptionsFormResult => {
  // 再計算の抑止は React Compiler の自動メモ化に任せる（手動 useMemo は不要）。
  const moveOptions = buildMoveOptions(characters);
  const [exceptions, setExceptions] =
    useState<PunishException[]>(initialExceptions);
  const [saving, setSaving] = useState(false);
  const { feedback, setFeedback } = useAutoDismissedFeedback();

  const updateException = (
    index: number,
    patch: Partial<PunishException>,
  ): void => {
    setExceptions((current) =>
      current.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    );
  };

  const addException = (): void => {
    const firstMoveId = moveOptions.at(0)?.value ?? "";
    setExceptions((current) => [
      ...current,
      {
        attackerMoveId: firstMoveId,
        defenderMoveId: firstMoveId,
        action: "exclude",
      },
    ]);
  };

  const removeException = (index: number): void => {
    setExceptions((current) =>
      current.filter((_entry, position) => position !== index),
    );
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    setFeedback(undefined);
    setFeedback(
      await saveWithFeedback(ADMIN_API_ENDPOINTS.exceptions, exceptions),
    );
    setSaving(false);
  };

  return {
    exceptions,
    moveOptions,
    saving,
    feedback,
    addException,
    updateException,
    removeException,
    save,
  };
};
