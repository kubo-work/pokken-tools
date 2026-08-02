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
 * ダメージ系の値。多段ヒット技は { perHit, hitCount } で持ち、「perHit×hitCount」と表示する
 * （例: 20×3）。単発技は数値のまま。
 */
export type DamageValue = number | { perHit: number; hitCount: number };
/**
 * ヒットごとに性能が変わる技の、同じ性能が連続するヒットのまとまり（グループ）。
 * 値はすべて「グループ内の1ヒットあたり」の値（例: 45×3 なら baseDamage: 45, hitCount: 3）。
 * 未設定のフィールドは「その打点では値なし（-表示）」であり、技単位の値の継承ではない。
 * ダメージ系3項目（baseDamage/chipDamage/guardCrushValue）はいずれかのグループで定義したら、
 * 技単位・共鳴単位の同名フィールド（単一値）は設定禁止（二重入力防止、schema で検証）。
 * guardLevel/airGroundJudgment は技単位の値との共存を許可し、技単位の値は代表値
 * （通常は1ヒット目）として扱う。
 */
export interface HitBreakdownEntry {
  /** グループ内の連続ヒット数。1以上（DamageValue の hitCount は総ヒット数で min 2 だが、これは別物）。 */
  hitCount: number;
  baseDamage?: number;
  chipDamage?: number;
  guardCrushValue?: number;
  guardLevel?: GuardLevel;
  airGroundJudgment?: AirGroundJudgment;
}
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
  guardFrameAdvantageOnPokemonMoveCancel?: number;
  hitFrameAdvantage?: number;
  hitFrameAdvantageOnPokemonMoveCancel?: number;
  strength?: number;
  guardLevel?: GuardLevel;
  baseDamage?: DamageValue;
  chipDamage?: DamageValue;
  guardCrushValue?: DamageValue;
  phaseChangePoints?: number;
  /** 共鳴中だけヒットごとの性能が変わる技向け。技単位の hitBreakdown と同じ規約。 */
  hitBreakdown?: HitBreakdownEntry[];
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
  /**
   * ポケモン技にキャンセルした場合のガード硬直差。攻撃側視点、符号付き。
   * ポケモン技へキャンセルすることで通常のガード硬直差より有利になる技
   * （マイナスからプラスに転じる等）向け。未計測・非対応なら省略。
   */
  guardFrameAdvantageOnPokemonMoveCancel?: number;
  /** ヒット硬直差。攻撃側視点の有利/不利フレーム。ダウンする技は "down"。表示専用で、未計測なら省略。 */
  hitFrameAdvantage?: HitFrameAdvantage;
  /**
   * ポケモン技にキャンセルした場合のヒット硬直差。攻撃側視点、符号付き。
   * guardFrameAdvantageOnPokemonMoveCancel と同様、単一値のみ。未計測・非対応なら省略。
   */
  hitFrameAdvantageOnPokemonMoveCancel?: number;
  /**
   * 攻撃の強度。攻撃属性 (attackType) に応じた範囲で入力する：打撃 (strike) は 1〜8、弾 (projectile) は 1〜8。
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
  /** 基礎ダメージ。未計測なら省略（「-」表示）。 */
  baseDamage?: DamageValue;
  /** 削りダメージ（ガードした相手に与える HP ダメージ）。未計測なら省略。 */
  chipDamage?: DamageValue;
  /** ガード削り値（相手のガードゲージを削る量）。未計測なら省略。 */
  guardCrushValue?: DamageValue;
  /** PCH値（フェイズチェンジポイント）。未計測なら省略。 */
  phaseChangePoints?: number;
  /**
   * ヒットごとに性能が変わる技の内訳（1グループ以上）。
   * baseDamage/chipDamage/guardCrushValue/guardLevel/airGroundJudgment のうち
   * ヒットごとに変わる項目だけを各グループに設定する。詳細は HitBreakdownEntry を参照。
   */
  hitBreakdown?: HitBreakdownEntry[];
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
