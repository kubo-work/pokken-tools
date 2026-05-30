export type MoveCategory = "attack" | "block" | "grab";
export type MoveAttackType = "strike" | "projectile";
export type Phase = "field" | "duel";
export type ResonanceState = "normal" | "resonance";
export type MoveStrength = "weak" | "medium" | "strong";
export type GuardLevel = "high" | "mid" | "low";
export type SpecialAttribute = "blockPiercing" | "armor";

export interface ResonanceOverride {
  startup?: number;
  recovery?: number;
  strength?: MoveStrength;
}

export interface Move {
  id: string;
  name: string;
  command: string;
  category: MoveCategory;
  attackType?: MoveAttackType;
  guardLevels: GuardLevel[];
  startup: number;
  recovery: number;
  strength: MoveStrength;
  specialAttributes?: SpecialAttribute[];
  resonance?: ResonanceOverride;
  resonanceOnly?: boolean;
  note?: string;
}

export interface PunishException {
  attackerMoveId: string;
  defenderMoveId: string;
  action: "exclude" | "hit";
  /** 先端当てなど特定の状況で攻撃側の硬直Fが通常と変わる場合の上書き値。action="hit" のときに参照する。 */
  recoveryOverride?: number;
  note?: string;
}
