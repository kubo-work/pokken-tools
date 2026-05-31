export type MoveCategory = "attack" | "block" | "grab";
export type MoveAttackType = "strike" | "projectile";
export type Phase = "field" | "duel";
export type ResonanceState = "normal" | "resonance";
export type MoveStrength = "weak" | "medium" | "strong";
export type GuardLevel =
  | "high"
  | "mid_high"
  | "mid"
  | "special_mid"
  | "mid_low"
  | "low";
export type SpecialAttribute = "blockPiercing" | "armor";
/** 親技 (normal) / ため (charge) / 派生 (derivative)。undefined は normal 扱い。 */
export type MoveVariant = "normal" | "charge" | "derivative";

export interface ResonanceOverride {
  startup?: number;
  recovery?: number;
  strength?: MoveStrength;
  guardLevel?: GuardLevel;
}

export interface Move {
  id: string;
  name: string;
  command: string;
  category: MoveCategory;
  attackType?: MoveAttackType;
  guardLevel: GuardLevel | null;
  startup: number;
  recovery: number;
  strength: MoveStrength;
  specialAttributes?: SpecialAttribute[];
  /** "charge" / "derivative" の場合は親技の id を parentMoveId に必ず入れる。 */
  variant?: MoveVariant;
  parentMoveId?: string;
  resonance?: ResonanceOverride;
  resonanceOnly?: boolean;
  /** 技名直下に常時表示する短い注記。1 行向け。 */
  note?: string;
  /** 詳細ページでクリック展開する長文の説明。段落 OK。 */
  description?: string;
}

export interface PunishException {
  attackerMoveId: string;
  defenderMoveId: string;
  action: "exclude" | "hit";
  /** 先端当てなど特定の状況で攻撃側の硬直Fが通常と変わる場合の上書き値。action="hit" のときに参照する。 */
  recoveryOverride?: number;
  note?: string;
}
