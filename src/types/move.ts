export type MoveCategory = "attack" | "block" | "grab";
export type Phase = "field" | "duel";
export type ResonanceState = "normal" | "resonance";
export type MoveStrength = "weak" | "medium" | "strong";
export type GuardLevel = "high" | "mid" | "low";

export interface ResonanceOverride {
  startup?: number;
  active?: number;
  blockAdvantage?: number;
  hitAdvantage?: number;
  damage?: number;
  strength?: MoveStrength;
}

export interface Move {
  id: string;
  name: string;
  command: string;
  category: MoveCategory;
  guardLevels: GuardLevel[];
  startup: number;
  active: number;
  blockAdvantage: number;
  hitAdvantage: number;
  damage: number;
  strength: MoveStrength;
  resonance?: ResonanceOverride;
  resonanceOnly?: boolean;
  note?: string;
}

export interface PunishException {
  attackerMoveId: string;
  defenderMoveId: string;
  action: "exclude" | "hit";
  note?: string;
}
