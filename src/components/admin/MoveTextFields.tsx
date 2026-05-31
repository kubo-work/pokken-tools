"use client";

import { Textarea, TextInput } from "@mantine/core";
import type { Move } from "@/types/move";
import { setMoveField } from "./moveUpdaters";

export interface MoveTextFieldsProps {
  move: Move;
  onChange: (move: Move) => void;
}

const toOptional = (value: string): string | undefined =>
  value === "" ? undefined : value;

export const MoveTextFields = ({ move, onChange }: MoveTextFieldsProps) => (
  <>
    <TextInput
      label="備考"
      description="技名直下に常時表示する短い注記（1 行）"
      value={move.note ?? ""}
      onChange={(event) =>
        onChange(
          setMoveField(move, "note", toOptional(event.currentTarget.value)),
        )
      }
    />
    <Textarea
      label="説明"
      description="詳細ページで「説明」をクリックすると展開される長文。空欄なら表示なし"
      autosize
      minRows={2}
      value={move.description ?? ""}
      onChange={(event) =>
        onChange(
          setMoveField(
            move,
            "description",
            toOptional(event.currentTarget.value),
          ),
        )
      }
    />
  </>
);
