import type { Move } from "./move";

export interface Character {
  id: string;
  name: string;
  title?: string;
  fieldMoves: Move[];
  duelMoves: Move[];
}
