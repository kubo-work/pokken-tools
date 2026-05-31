import type {
  GuardLevel,
  Move,
  MoveStrength,
  ResonanceOverride,
} from "@/types/move";
import type { ResonanceNumberField } from "./moveFieldsHelpers";

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

/** 共鳴差分の数値フィールド (startup / recovery) を更新。空文字なら削除。 */
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

/** 共鳴差分の strength を更新。undefined なら削除。 */
export const setResonanceStrength = (
  move: Move,
  strength: MoveStrength | undefined,
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
