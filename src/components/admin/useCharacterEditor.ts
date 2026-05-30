"use client";

import { useEffect, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { Character } from "@/types/character";
import type { Move, Phase } from "@/types/move";
import { createMove } from "@/lib/factory";
import { characterSchema } from "@/lib/schema";

export interface Feedback {
  ok: boolean;
  message: string;
}

const getPhaseMoves = (character: Character, phase: Phase): Move[] =>
  phase === "field" ? character.fieldMoves : character.duelMoves;

const withPhaseMoves = (
  character: Character,
  phase: Phase,
  moves: Move[],
): Character =>
  phase === "field"
    ? { ...character, fieldMoves: moves }
    : { ...character, duelMoves: moves };

export interface UseCharacterEditorResult {
  character: Character;
  saving: boolean;
  feedback: Feedback | undefined;
  setCharacterName: (name: string) => void;
  updateMove: (phase: Phase, index: number, move: Move) => void;
  addMove: (phase: Phase) => void;
  removeMove: (phase: Phase, index: number) => void;
  reorderMoves: (phase: Phase, fromIndex: number, toIndex: number) => void;
  exportJson: () => void;
  importJson: (file: File | null) => Promise<void>;
  save: () => Promise<void>;
  getPhaseMoves: (phase: Phase) => Move[];
}

export const useCharacterEditor = (
  initial: Character,
): UseCharacterEditorResult => {
  const [character, setCharacter] = useState<Character>(initial);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | undefined>(undefined);

  useEffect(() => {
    setCharacter(initial);
  }, [initial]);

  const setCharacterName = (name: string): void => {
    setCharacter((current) => ({ ...current, name }));
  };

  const updateMove = (phase: Phase, index: number, move: Move): void => {
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        getPhaseMoves(current, phase).map((entry, position) =>
          position === index ? move : entry,
        ),
      ),
    );
  };

  const addMove = (phase: Phase): void => {
    setCharacter((current) =>
      withPhaseMoves(current, phase, [
        ...getPhaseMoves(current, phase),
        createMove(current.id, phase),
      ]),
    );
  };

  const removeMove = (phase: Phase, index: number): void => {
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        getPhaseMoves(current, phase).filter(
          (_move, position) => position !== index,
        ),
      ),
    );
  };

  const reorderMoves = (
    phase: Phase,
    fromIndex: number,
    toIndex: number,
  ): void => {
    if (fromIndex === toIndex) {
      return;
    }
    setCharacter((current) =>
      withPhaseMoves(
        current,
        phase,
        arrayMove(getPhaseMoves(current, phase), fromIndex, toIndex),
      ),
    );
  };

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
      setCharacter(result.data);
      setFeedback({ ok: true, message: "読み込みました（保存ボタンで反映）" });
    } catch (error) {
      console.error("character JSON import failed", error);
      const message =
        error instanceof Error ? error.message : String(error);
      setFeedback({
        ok: false,
        message: `JSONのパースに失敗しました: ${message}`,
      });
    }
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    setFeedback(undefined);
    try {
      const response = await fetch(
        `/api/admin/characters/${character.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(character),
        },
      );
      if (response.ok) {
        setFeedback({ ok: true, message: "保存しました" });
        return;
      }
      const detail = await response.text().catch(() => "");
      setFeedback({
        ok: false,
        message: detail === ""
          ? "保存に失敗しました（入力内容を確認してください）"
          : `保存に失敗しました: ${detail}`,
      });
    } catch (error) {
      console.error("character save failed", error);
      const message =
        error instanceof Error ? error.message : String(error);
      setFeedback({ ok: false, message: `通信エラー: ${message}` });
    } finally {
      setSaving(false);
    }
  };

  return {
    character,
    saving,
    feedback,
    setCharacterName,
    updateMove,
    addMove,
    removeMove,
    reorderMoves,
    exportJson,
    importJson,
    save,
    getPhaseMoves: (phase) => getPhaseMoves(character, phase),
  };
};
