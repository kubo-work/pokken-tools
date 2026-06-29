import type {
  GuardLevel,
  Move,
  MoveCategory,
  ResonanceFlinch,
  ResonanceOverride,
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
 * 技の分類（属性）を更新する。つかみ (grab) は攻撃属性・強度・判定を持たないため、
 * grab へ切り替えたときはこれらを空にする（attackType / strength は削除、guardLevel は null）。
 */
export const setMoveCategory = (move: Move, category: MoveCategory): Move => {
  if (category !== "grab") {
    return { ...move, category };
  }
  const next: Move = { ...move, category, guardLevel: null };
  delete next.attackType;
  delete next.strength;
  delete next.resonanceFlinch;
  return next;
};

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
