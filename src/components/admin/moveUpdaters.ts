import type {
  AirGroundJudgment,
  DamageValue,
  GuardFrameAdvantage,
  GuardLevel,
  HitFrameAdvantage,
  Move,
  MoveAttackType,
  MoveCategory,
  ResonanceFlinch,
  ResonanceOverride,
  SpecialAttribute,
} from "@/types/move";
import {
  DEFAULT_SWITCH_ACTIVE_FRAME,
  type ResonanceFlinchMode,
  type ResonanceNumberField,
} from "./moveFieldsHelpers";

/**
 * Move 編集の純粋関数群。コンポーネントは onChange に新しい Move を渡すだけで済むよう、
 * 部分更新ロジックはここに集約する。state も副作用も持たない。
 */

const toNumber = (value: number | string): number =>
  typeof value === "number" ? value : 0;

/** 1 フィールドだけ差し替えた Move を返す。 */
export const setMoveField = <Key extends keyof Move>(
  move: Move,
  key: Key,
  value: Move[Key],
): Move => ({ ...move, [key]: value });

/** 共鳴差分の数値フィールド (startup / guardFrameAdvantage / hitFrameAdvantage) を更新。空文字なら削除。 */
export const setResonanceNumber = (
  move: Move,
  key: ResonanceNumberField,
  value: number | string,
): Move => {
  const next: ResonanceOverride = { ...move.resonance };
  if (value === "") {
    delete next[key];
  } else {
    next[key] = toNumber(value);
  }
  return { ...move, resonance: next };
};

/**
 * 攻撃に紐づく項目（攻撃属性・強度・判定・共鳴怯ませ）を空にした Move を返す。
 * 「攻撃しない技」へ変えるときの共通処理（attackType / strength / resonanceFlinch は削除、
 * guardLevel は null）。属性なし・つかみ・攻撃属性なしのいずれでも同じ不変条件を満たす。
 */
const clearAttackFields = (move: Move): Move => {
  const next: Move = { ...move, guardLevel: null };
  delete next.attackType;
  delete next.strength;
  delete next.resonanceFlinch;
  return next;
};

/**
 * 技の属性 (category) を更新する。攻撃 (attack) / ブロック (block) は攻撃属性以下を保持する。
 * 属性なし (undefined) と つかみ (grab) は攻撃属性・強度・判定・共鳴怯ませを持たない。
 */
export const setMoveCategory = (
  move: Move,
  category: MoveCategory | undefined,
): Move => {
  if (category === "attack" || category === "block") {
    return { ...move, category };
  }
  // ここに来るのは grab か undefined（属性なし）のみ。
  const next = clearAttackFields(move);
  if (category === undefined) {
    delete next.category;
  } else {
    next.category = category;
  }
  return next;
};

/**
 * 技本体の攻撃属性を更新する。攻撃属性を外した（undefined）技は「攻撃しない技」となり、
 * 強度・判定・共鳴怯ませ強度を持たない。
 */
export const setMoveAttackType = (
  move: Move,
  attackType: MoveAttackType | undefined,
): Move =>
  attackType !== undefined
    ? { ...move, attackType }
    : clearAttackFields(move);

/** 技本体の強度を更新。undefined（攻撃属性なし等）なら強度を削除する。 */
export const setMoveStrength = (
  move: Move,
  strength: number | undefined,
): Move => {
  const next: Move = { ...move };
  if (strength === undefined) {
    delete next.strength;
  } else {
    next.strength = strength;
  }
  return next;
};

/** 技本体の共鳴怯ませ強度を更新。undefined なら削除する。 */
export const setMoveResonanceFlinch = (
  move: Move,
  resonanceFlinch: ResonanceFlinch | undefined,
): Move => {
  const next: Move = { ...move };
  if (resonanceFlinch === undefined) {
    delete next.resonanceFlinch;
  } else {
    next.resonanceFlinch = resonanceFlinch;
  }
  return next;
};

/**
 * 入力モード（弱／強／弱→強）と切替フレームから技本体の共鳴怯ませ強度を更新する。
 * mode が null なら削除、"transition" なら切替フレーム付きの値、それ以外はモード値をそのまま設定。
 * 切替フレーム未指定時は DEFAULT_SWITCH_ACTIVE_FRAME で補完する。
 */
export const setMoveResonanceFlinchMode = (
  move: Move,
  mode: ResonanceFlinchMode | null,
  switchActiveFrame: number | undefined,
): Move => {
  if (mode === null) {
    return setMoveResonanceFlinch(move, undefined);
  }
  if (mode === "transition") {
    return setMoveResonanceFlinch(move, {
      switchActiveFrame: switchActiveFrame ?? DEFAULT_SWITCH_ACTIVE_FRAME,
    });
  }
  return setMoveResonanceFlinch(move, mode);
};

/** ガード硬直差を更新する。単一値・範囲のどちらも受け取れる。 */
export const setMoveGuardFrameAdvantage = (
  move: Move,
  guardFrameAdvantage: GuardFrameAdvantage,
): Move => ({ ...move, guardFrameAdvantage });

/** ヒット硬直差を更新する。undefined（未計測）なら削除する。 */
export const setMoveHitFrameAdvantage = (
  move: Move,
  hitFrameAdvantage: HitFrameAdvantage | undefined,
): Move => {
  const next: Move = { ...move };
  if (hitFrameAdvantage === undefined) {
    delete next.hitFrameAdvantage;
  } else {
    next.hitFrameAdvantage = hitFrameAdvantage;
  }
  return next;
};

/**
 * 特殊属性を更新する。空配列なら specialAttributes 自体を削除する。
 * 弾消し (projectileNullify) を外したときは弾消し開始フレームも一緒に削除し、
 * 「開始フレームは弾消し属性を持つ技のみ」の不変条件を保つ。
 */
export const setMoveSpecialAttributes = (
  move: Move,
  attributes: SpecialAttribute[],
): Move => {
  const next: Move = { ...move };
  if (attributes.length === 0) {
    delete next.specialAttributes;
  } else {
    next.specialAttributes = attributes;
  }
  if (!attributes.includes("projectileNullify")) {
    delete next.projectileNullifyStartFrame;
  }
  return next;
};

/** 弾消し開始フレームを更新。undefined（未計測）なら削除する。 */
export const setMoveProjectileNullifyStartFrame = (
  move: Move,
  startFrame: number | undefined,
): Move => {
  const next: Move = { ...move };
  if (startFrame === undefined) {
    delete next.projectileNullifyStartFrame;
  } else {
    next.projectileNullifyStartFrame = startFrame;
  }
  return next;
};

/** 空・地判定を更新。undefined なら削除する。 */
export const setMoveAirGroundJudgment = (
  move: Move,
  airGroundJudgment: AirGroundJudgment | undefined,
): Move => {
  const next: Move = { ...move };
  if (airGroundJudgment === undefined) {
    delete next.airGroundJudgment;
  } else {
    next.airGroundJudgment = airGroundJudgment;
  }
  return next;
};

/** DamageValue を持つフィールド名。PCH値 (phaseChangePoints) は単一数値のため含めない。 */
export type MoveDamageValueFieldKey =
  | "baseDamage"
  | "chipDamage"
  | "guardCrushValue";

/** ダメージ系フィールド（基礎/削り/ガード削り）を更新。undefined（未計測）なら削除する。 */
export const setMoveDamageValue = (
  move: Move,
  key: MoveDamageValueFieldKey,
  value: DamageValue | undefined,
): Move => {
  const next: Move = { ...move };
  if (value === undefined) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return next;
};

/** PCH値を更新。undefined（未計測）なら削除する。 */
export const setMovePhaseChangePoints = (
  move: Move,
  phaseChangePoints: number | undefined,
): Move => {
  const next: Move = { ...move };
  if (phaseChangePoints === undefined) {
    delete next.phaseChangePoints;
  } else {
    next.phaseChangePoints = phaseChangePoints;
  }
  return next;
};

/** 共鳴差分のダメージ系フィールド（基礎/削り/ガード削り）を更新。undefined なら削除。 */
export const setResonanceDamageValue = (
  move: Move,
  key: MoveDamageValueFieldKey,
  value: DamageValue | undefined,
): Move => {
  const next: ResonanceOverride = { ...move.resonance };
  if (value === undefined) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return { ...move, resonance: next };
};

/** 共鳴差分の PCH値を更新。undefined なら削除。 */
export const setResonancePhaseChangePoints = (
  move: Move,
  phaseChangePoints: number | undefined,
): Move => {
  const next: ResonanceOverride = { ...move.resonance };
  if (phaseChangePoints === undefined) {
    delete next.phaseChangePoints;
  } else {
    next.phaseChangePoints = phaseChangePoints;
  }
  return { ...move, resonance: next };
};

/** 共鳴差分の strength を更新。undefined なら削除。 */
export const setResonanceStrength = (
  move: Move,
  strength: number | undefined,
): Move => {
  const next: ResonanceOverride = { ...move.resonance };
  if (strength === undefined) {
    delete next.strength;
  } else {
    next.strength = strength;
  }
  return { ...move, resonance: next };
};

/** 共鳴差分の guardLevel を更新。undefined なら削除。 */
export const setResonanceGuardLevel = (
  move: Move,
  guardLevel: GuardLevel | undefined,
): Move => {
  const next: ResonanceOverride = { ...move.resonance };
  if (guardLevel === undefined) {
    delete next.guardLevel;
  } else {
    next.guardLevel = guardLevel;
  }
  return { ...move, resonance: next };
};

/** 共鳴差分 ON/OFF を切り替える。OFF にすると resonance を完全に削除。 */
export const toggleResonance = (move: Move, enabled: boolean): Move => ({
  ...move,
  resonance: enabled ? (move.resonance ?? {}) : undefined,
});
