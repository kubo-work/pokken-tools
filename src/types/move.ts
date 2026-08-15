export type MoveCategory = "attack" | "block" | "grab";
export type MoveAttackType = "strike" | "projectile";
/** 技の所属フェイズ。common は FP/DP の両フェイズで使える共通技を表す。 */
export type Phase = "field" | "duel" | "common";
/**
 * 技の実効値解決で使う「使用時のフェイズ」。共通技（commonMoves）は FP/DP どちらでも
 * 使われうるため、登録先を表す Phase（"common" を含む）とは別の概念として持つ。
 */
export type UsagePhase = Exclude<Phase, "common">;
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
 * PCH値の区切り1つ。ヒットごとに PCH が変わる技で、同じ値が連続するヒットのまとまり。
 * ダメージ系の多段表記（DamageValue のオブジェクト形）と違い hitCount は1以上を許す
 * （1ヒットだけ PCH が違う技を区切り1個で表せるようにするため）。
 */
export interface PhaseChangePointsSegment {
  perHit: number;
  hitCount: number;
}
/**
 * PCH値。単発・全ヒットで PCH が一定の多段技は number（小数可）、ヒットごとに PCH が
 * 変わる技は区切りの配列（例: 5×1 + 3.5×4 は [{perHit:5,hitCount:1},{perHit:3.5,hitCount:4}]）。
 * ヒット内訳（HitBreakdownEntry.phaseChangePoints）とは別の軸で、ダメージ等は変わらず
 * PCH だけ違う技のために使う。
 */
export type PhaseChangePointsValue = number | PhaseChangePointsSegment[];
/**
 * ヒットごとに性能が変わる技の、同じ性能が連続するヒットのまとまり（グループ）。
 * 値はすべて「グループ内の1ヒットあたり」の値（例: 45×3 なら baseDamage: 45, hitCount: 3）。
 * 未設定のフィールドは「その打点では値なし（-表示）」であり、技単位の値の継承ではない。
 * 数値4項目（baseDamage/chipDamage/guardCrushValue/phaseChangePoints）はいずれかのグループで
 * 定義したら、技単位・共鳴単位の同名フィールド（単一値）は設定禁止（二重入力防止、schema で検証）。
 * guardLevel/airGroundJudgment/resonanceFlinch/attackType/strength は技単位の値との共存を許可し、
 * 技単位の値は代表値（通常は1ヒット目）として扱う。
 */
export interface HitBreakdownEntry {
  /** グループ内の連続ヒット数。1以上（DamageValue の hitCount は総ヒット数で min 2 だが、これは別物）。 */
  hitCount: number;
  baseDamage?: number;
  chipDamage?: number;
  guardCrushValue?: number;
  /** 小数可。グループ内は単一値のため、ヒットごとに違う PCH は Move.phaseChangePoints の区切り配列側で表す。 */
  phaseChangePoints?: number;
  guardLevel?: GuardLevel;
  airGroundJudgment?: AirGroundJudgment;
  /**
   * 共鳴怯ませ強度。グループ内は性能が一定なので、技単位の { switchActiveFrame }（持続の途中で
   * 弱→強に変わる技）のような切替形式は持たず、弱／強のいずれかだけを取る。
   */
  resonanceFlinch?: ResonanceFlinchLevel;
  /**
   * このグループの攻撃属性。1ヒット目打撃・2ヒット目弾のように、ヒットごとに攻撃属性
   * そのものが変わる技向け（Issue #90）。未設定のグループは技単位の attackType を代表値とする。
   */
  attackType?: MoveAttackType;
  /** このグループの強度。attackType と同じくヒットごとに変わりうるため対で持つ。 */
  strength?: number;
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

/**
 * 条件（共鳴・ジャスト入力・フェイズ差）によらず共通して変わりうる性能値。
 * 条件ごとに変わりうる項目は異なるため（例: フェイズでは判定は変わらないがコマンドは変わる）、
 * 共通部分だけをここに置き、固有項目は各上書き型が足す。
 * 硬直差は当面単一値のみ対応（範囲・ダウンが必要になったら拡張する）。
 */
export interface MoveOverrideBase {
  startup?: number;
  activeUntilFrame?: number;
  guardFrameAdvantage?: number;
  guardFrameAdvantageOnPokemonMoveCancel?: number;
  hitFrameAdvantage?: number;
  hitFrameAdvantageOnPokemonMoveCancel?: number;
  strength?: number;
  baseDamage?: DamageValue;
  /** Move の totalDamage と同じ規約（実測合計）。詳細は Move.totalDamage 参照。 */
  totalDamage?: number;
  chipDamage?: DamageValue;
  guardCrushValue?: DamageValue;
  phaseChangePoints?: PhaseChangePointsValue;
  /** その条件下だけヒットごとの性能が変わる技向け。技単位の hitBreakdown と同じ規約。 */
  hitBreakdown?: HitBreakdownEntry[];
}

/** 条件付き（共鳴・ジャスト入力）の性能上書き値。同じ入力に対する結果だけが変わる。 */
export interface MoveOverride extends MoveOverrideBase {
  guardLevel?: GuardLevel;
}

/**
 * フィールドフェイズでの上書き値。
 *
 * 共鳴・ジャスト入力が「同じ入力で結果が変わる」のに対し、フェイズ差は入力そのものが
 * 変わりうるため command を持つ（例: DP では 5A、FP では 6A の技）。
 * 判定 (guardLevel) は FP でも意味を持つが値は変わらないため、意図的に持たせていない。
 * 攻撃属性・空地判定・特殊属性・共鳴怯ませ強度も同様にフェイズでは変わらない。
 */
export interface FieldPhaseOverride extends MoveOverrideBase {
  command?: string;
}

/** ジャスト入力の受付フレーム範囲。動作開始を1F目とした経過フレームで、start <= end。 */
export interface JustInputAcceptFrames {
  start: number;
  end: number;
}

/**
 * ジャスト入力時の上書き値。共鳴と直交する軸のため、ため・派生技を含むどの技にも設定できる。
 * 各フィールドは通常時の値からの絶対値差し替え（他の上書き層と同じ規約）。
 */
export interface JustInputOverride extends MoveOverride {
  /** ジャスト入力の受付フレーム範囲。未計測なら省略。 */
  acceptFrames?: JustInputAcceptFrames;
  /**
   * 共鳴中のジャスト入力が通常時のジャスト入力と異なる場合だけ設定する差分。
   * 未設定なら共鳴中も通常時のジャスト値をそのまま使う。
   */
  resonance?: MoveOverride;
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
   * 攻撃持続の終端フレーム。動作開始を1F目とした絶対フレームで、この技が攻撃判定を
   * 持つ最後のフレームを表す（例: サーナイトの2Yなら27で「攻撃持続〜27F」）。
   * 発生 (startup) 以上の値でなければならない。未計測なら省略。
   */
  activeUntilFrame?: number;
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
  /**
   * ガード割り込みフレーム。ため・派生技 (variant が charge/derivative) にのみ設定できる。
   * 連携の1つ前の段（同じ親を持つ直前の兄弟技、最初の子技なら親技）をガードした後、
   * この技が当たるまでに相手が動ける隙間フレーム数を表す。
   * 例: サーナイトの 5YYY は 5YY との間に 4F の隙間があるため 4。
   * 0 は隙間なし（連続ガードで割り込めない）。未計測なら省略。
   */
  guardInterruptFrames?: number;
  resonance?: MoveOverride;
  /**
   * ジャスト入力時の上書き値。共鳴とは独立した軸で、ため・派生技にも設定できる。
   * 未設定ならジャスト入力による性能差はない（通常時の値のまま）。
   */
  justInput?: JustInputOverride;
  /**
   * フィールドフェイズでの上書き値。共通技（commonMoves）にのみ設定できる
   * （schema で検証。fieldMoves/duelMoves の技には設定不可）。
   * この技本体の値はデュエルフェイズでの性能として入力し、フィールドフェイズで
   * 異なる項目だけをここに入れる。未設定ならフィールドフェイズでも技本体の値のまま。
   * 共鳴・ジャスト入力とは異なり、適用順で最も弱い層（resolveMove 参照）として扱うため、
   * 「フィールドフェイズかつ共鳴時だけ別値」を表現したくなったら justInput.resonance と
   * 同様の入れ子（fieldPhase.resonance）を検討する。現状は未対応。
   */
  fieldPhase?: FieldPhaseOverride;
  resonanceOnly?: boolean;
  /** 基礎ダメージ。未計測なら省略（「-」表示）。 */
  baseDamage?: DamageValue;
  /**
   * 技を最初から最後まで当てたときに実際に入る基礎ダメージの実測合計。
   * 多段ヒット技は1ヒット目以降にコンボ補正がかかるため、baseDamage の perHit×hitCount や
   * hitBreakdown の総和とは一致しない（計算では求められない値のため実測値を手入力する）。
   * 基礎ダメージが多段ヒット（perHit×hitCount またはヒット内訳）の技にのみ設定できる
   * （schema で検証。1ヒットの技に設定するとエラーになる）。
   */
  totalDamage?: number;
  /** 削りダメージ（ガードした相手に与える HP ダメージ）。未計測なら省略。 */
  chipDamage?: DamageValue;
  /** ガード削り値（相手のガードゲージを削る量）。未計測なら省略。 */
  guardCrushValue?: DamageValue;
  /**
   * PCH値（フェイズチェンジポイント）。未計測なら省略。小数可。ヒットごとに PCH が
   * 変わる技は区切りの配列（PhaseChangePointsValue 参照）。
   */
  phaseChangePoints?: PhaseChangePointsValue;
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
