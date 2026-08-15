import type {
  AirGroundJudgment,
  GuardLevel,
  MoveAttackType,
  MoveCategory,
  Phase,
  ProjectileStrengthSymbol,
  ResonanceFlinchLevel,
  SpecialAttribute,
  UsagePhase,
} from "@/types/move";

/**
 * 技が取りうる値の集合。選択肢の列挙・バリデーション・網羅チェックの基準として使う。
 * 表示ラベルは moveLabels、値に対する判断は moveRules に置く。
 */

export const MOVE_CATEGORIES: MoveCategory[] = ["attack", "block", "grab"];
export const MOVE_ATTACK_TYPES: MoveAttackType[] = ["strike", "projectile"];
/** 弾だけが取れる強度の記号。Select の選択肢と、値の絞り込み（asOptionalEnumValue）に使う。 */
export const PROJECTILE_STRENGTH_SYMBOLS: ProjectileStrengthSymbol[] = [
  "erase",
  "inert",
];
export const RESONANCE_FLINCH_LEVELS: ResonanceFlinchLevel[] = [
  "weak",
  "strong",
];
export const MOVE_SPECIAL_ATTRIBUTES: SpecialAttribute[] = [
  "blockPiercing",
  "armor",
  "projectileNullify",
];
export const AIR_GROUND_JUDGMENTS: AirGroundJudgment[] = ["air", "ground"];
export const GUARD_LEVELS: GuardLevel[] = [
  "high",
  "mid_high",
  "mid",
  "special_mid",
  "mid_low",
  "low",
];
export const PHASES: Phase[] = ["duel", "field", "common"];
/** 技の使用時フェイズ（登録先を表す PHASES から "common" を除いたもの）。 */
export const USAGE_PHASES: UsagePhase[] = PHASES.filter(
  (phase): phase is UsagePhase => phase !== "common",
);
/**
 * 共通技の使用フェイズが未選択のときの既定値。管理画面の PHASES 表示順と揃え DP を既定にする。
 * usePunishSearch の初期状態と PunishSearch の select フォールバックの両方で使い、
 * デフォルト値が2箇所に分散しないようにする。
 */
export const DEFAULT_USAGE_PHASE: UsagePhase = "duel";

/**
 * ヒット内訳のダメージ系フィールド。値は「グループ内の1ヒットあたり」。
 * 技単位では DamageValue（多段表記を取りうる）である点が PCH値 と異なるため、
 * 数値項目全体（HIT_BREAKDOWN_NUMERIC_KEYS）とは別に、この3項目だけの集合も持つ。
 */
export const HIT_BREAKDOWN_DAMAGE_KEYS = [
  "baseDamage",
  "chipDamage",
  "guardCrushValue",
] as const;
export type HitBreakdownDamageKey = (typeof HIT_BREAKDOWN_DAMAGE_KEYS)[number];

/**
 * ヒット内訳の数値フィールド。値は「グループ内の1ヒットあたり」。
 * 内訳と技単位の単一値を併用できない（どちらが実効値か決まらない）のはこの4項目で、
 * 相互排他バリデーション（lib/schema）や更新処理（lib/moves/moveHitBreakdownUpdaters）が
 * 同じキー集合を参照するため、配列そのものをここで一元管理し、型もそこから導出する。
 */
export const HIT_BREAKDOWN_NUMERIC_KEYS = [
  ...HIT_BREAKDOWN_DAMAGE_KEYS,
  "phaseChangePoints",
] as const;
export type HitBreakdownNumericKey = (typeof HIT_BREAKDOWN_NUMERIC_KEYS)[number];

/**
 * ヒット内訳系の判定系フィールド。数値項目（HIT_BREAKDOWN_NUMERIC_KEYS）と違い技単位の値との
 * 共存を許可し、技単位の値は代表値（通常は1ヒット目）として扱う。
 * strength は数値だが、×hitCount で合算するダメージ系と違い「ヒット範囲ごとの代表値」として
 * ラベル化する扱いが判定系フィールドと同じため、ここに含める。
 */
export type HitBreakdownCategoricalKey =
  | "guardLevel"
  | "airGroundJudgment"
  | "resonanceFlinch"
  | "attackType"
  | "strength";
