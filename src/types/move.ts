export type MoveCategory = "attack" | "block" | "grab";
export type MoveAttackType = "strike" | "projectile";
export type Phase = "field" | "duel";
export type ResonanceState = "normal" | "resonance";
/** 攻撃属性ごとの強度の許容範囲（最小・最大）。 */
export interface StrengthRange {
  min: number;
  max: number;
}
export type GuardLevel =
  | "high"
  | "mid_high"
  | "mid"
  | "special_mid"
  | "mid_low"
  | "low";
export type SpecialAttribute = "blockPiercing" | "armor";
/**
 * 共鳴怯ませ強度。共鳴（相手が一定時間パワーアップしている状態）中の相手を
 * この技で怯ませられるかを表す。"weak"=怯ませ不可 / "strong"=怯ませ可。
 * 打撃同士・弾同士の撃ち合い優先度を表す数値の strength とは別軸の概念。
 */
export type ResonanceFlinchLevel = "weak" | "strong";
/**
 * 共鳴怯ませ強度の値。常時一定なら "weak" / "strong"。
 * 出始めは弱・途中から強に変わる技は { switchActiveFrame } で表し、
 * 持続 switchActiveFrame フレーム目以降が "strong"、それ未満が "weak"。
 */
export type ResonanceFlinch =
  | ResonanceFlinchLevel
  | { switchActiveFrame: number };
/** 親技 (normal) / ため (charge) / 派生 (derivative)。undefined は normal 扱い。 */
export type MoveVariant = "normal" | "charge" | "derivative";

export interface ResonanceOverride {
  startup?: number;
  guardFrameAdvantage?: number;
  hitFrameAdvantage?: number;
  strength?: number;
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
  /**
   * ガード硬直差。攻撃側視点の有利/不利フレームで、負の値ほど攻撃側が不利。
   * wiki の「ガード硬直差」をそのまま符号付きで入力する。確定反撃計算はこの値だけを使う
   * （防御側の余裕フレーム = -guardFrameAdvantage）。
   */
  guardFrameAdvantage: number;
  /** ヒット硬直差。攻撃側視点の有利/不利フレーム。表示専用で、未計測なら省略。 */
  hitFrameAdvantage?: number;
  /**
   * 攻撃の強度。攻撃属性 (attackType) に応じた範囲で入力する：打撃 (strike) は 1〜6、弾 (projectile) は 1〜8。
   * 攻撃属性を持たない「つかみ」技には強度がないため省略する。
   */
  strength?: number;
  /**
   * 共鳴中の相手を怯ませられるか（共鳴怯ませ強度）。攻撃属性を持たない「つかみ」技には設定しない。
   * 出始め弱→途中から強の技は { switchActiveFrame } で切替フレームを持つ。
   */
  resonanceFlinch?: ResonanceFlinch;
  specialAttributes?: SpecialAttribute[];
  /** "charge" / "derivative" の場合は親技の id を parentMoveId に必ず入れる。 */
  variant?: MoveVariant;
  parentMoveId?: string;
  /**
   * ため段階。variant==="charge" のときだけ意味を持つ。1=最小チャージで、数値が大きいほど高チャージ。
   * 同じ親に複数のため段階がある場合、最大値の段階が「ためMAX」として表示される。
   * 単一段階のためでは省略可（その場合は単に「ため」と表示）。
   */
  chargeLevel?: number;
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
  /**
   * 先端当てなど特定の状況で攻撃側のガード硬直差が通常と変わる場合の上書き値（符号付き）。
   * action="hit" のときに参照する。
   */
  guardFrameAdvantageOverride?: number;
  note?: string;
}
