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
export type SpecialAttribute = "blockPiercing" | "armor" | "projectileNullify";
/** 空中／地上判定。上中下段 (guardLevel) とは別軸の判定。 */
export type AirGroundJudgment = "air" | "ground";
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
/**
 * 硬直差の範囲。当て方や距離で硬直差が変わる技に使う。
 * min が最も不利側（小さい値）、max が最も有利側で、min <= max。
 */
export interface FrameAdvantageRange {
  min: number;
  max: number;
}
/** ガード硬直差。単一値、または当て方で変わる技の範囲。 */
export type GuardFrameAdvantage = number | FrameAdvantageRange;
/** ヒット硬直差。"down" は相手がダウンする技。 */
export type HitFrameAdvantage = number | FrameAdvantageRange | "down";
/** 親技 (normal) / ため (charge) / 派生 (derivative)。undefined は normal 扱い。 */
export type MoveVariant = "normal" | "charge" | "derivative";

/** 共鳴中の上書き値。硬直差は当面単一値のみ対応（範囲・ダウンが必要になったら拡張する）。 */
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
  /** 属性（攻撃／ブロック／つかみ）。攻撃しない・分類しない技では未設定。 */
  category?: MoveCategory;
  attackType?: MoveAttackType;
  guardLevel: GuardLevel | null;
  startup: number;
  /**
   * ガード硬直差。攻撃側視点の有利/不利フレームで、負の値ほど攻撃側が不利。
   * wiki の「ガード硬直差」をそのまま符号付きで入力する。当て方や距離で変わる技は範囲で登録する。
   * 確定反撃計算は最も不利側（範囲なら min）まで候補に含め、有利側では確定しない反撃に
   * 「当て方次第」の印を付ける（calcPunish 参照）。
   */
  guardFrameAdvantage: GuardFrameAdvantage;
  /** ヒット硬直差。攻撃側視点の有利/不利フレーム。ダウンする技は "down"。表示専用で、未計測なら省略。 */
  hitFrameAdvantage?: HitFrameAdvantage;
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
  /**
   * 弾消しが可能になるフレーム。動作開始を 1F 目とした経過フレーム
   * （攻撃発生前に弾を消せる技があるため、持続フレーム基準ではない）。
   * specialAttributes に "projectileNullify" を含む技のみ設定できる。未計測なら省略。
   */
  projectileNullifyStartFrame?: number;
  /**
   * 空中／地上判定。guardLevel と違い、つかみ技などどの技でも任意で設定できる。
   * 未設定は「-」表示。
   */
  airGroundJudgment?: AirGroundJudgment;
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
