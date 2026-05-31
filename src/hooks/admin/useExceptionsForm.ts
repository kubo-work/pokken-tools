"use client";

import { useMemo, useState } from "react";
import { PHASES, PHASE_META } from "@/lib/meta";
import type { Character } from "@/types/character";
import type { PunishException } from "@/types/move";
import type { Feedback } from "@/lib/feedback";

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
  const moveOptions = useMemo(() => buildMoveOptions(characters), [characters]);
  const [exceptions, setExceptions] =
    useState<PunishException[]>(initialExceptions);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | undefined>(undefined);

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
    try {
      const response = await fetch("/api/admin/exceptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exceptions),
      });
      if (response.ok) {
        setFeedback({ ok: true, message: "保存しました" });
        return;
      }
      const detail = await response.text().catch(() => "");
      setFeedback({
        ok: false,
        message: detail === ""
          ? "保存に失敗しました"
          : `保存に失敗しました: ${detail}`,
      });
    } catch (error) {
      console.error("exceptions save failed", error);
      const message =
        error instanceof Error ? error.message : String(error);
      setFeedback({ ok: false, message: `通信エラー: ${message}` });
    } finally {
      setSaving(false);
    }
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
