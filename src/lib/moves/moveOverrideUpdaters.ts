import type {
  HitBreakdownEntry,
  JustInputAcceptFrames,
  JustInputOverride,
  Move,
  MoveOverride,
} from "@/types/move";
import { setHitBreakdownWith } from "./moveHitBreakdownUpdaters";

/**
 * 条件付き差分（共鳴・ジャスト入力・共鳴中のジャスト入力）を編集する純粋関数群。
 * 技本体のフィールドを編集する moveUpdaters と対になる。
 */

/**
 * 条件付き差分が Move のどこに入っているかを表す。
 * 差分の位置だけを差し替えれば同じ更新ロジックを使い回せるよう、読み取りと書き戻しの組で表す。
 */
interface MoveOverrideLocation<Override extends MoveOverride> {
  read: (move: Move) => Override | undefined;
  write: (move: Move, override: Override) => Move;
  /** 差分が未設定のときの土台。全フィールドが任意なので空オブジェクトで足りる。 */
  createEmpty: () => Override;
}

const RESONANCE_LOCATION: MoveOverrideLocation<MoveOverride> = {
  read: (move) => move.resonance,
  write: (move, override) => ({ ...move, resonance: override }),
  createEmpty: () => ({}),
};

const JUST_INPUT_LOCATION: MoveOverrideLocation<JustInputOverride> = {
  read: (move) => move.justInput,
  write: (move, override) => ({ ...move, justInput: override }),
  createEmpty: () => ({}),
};

/** ジャスト入力自体は既に ON（move.justInput が存在）の前提で使う。 */
const JUST_INPUT_RESONANCE_LOCATION: MoveOverrideLocation<MoveOverride> = {
  read: (move) => move.justInput?.resonance,
  write: (move, override) => ({
    ...move,
    justInput: { ...move.justInput, resonance: override },
  }),
  createEmpty: () => ({}),
};

/**
 * 条件付き差分の 1 フィールドを更新する。undefined ならキーごと削除し、
 * JSON 化したときにフィールド自体が残らないようにする（省略＝変化なしの規約）。
 */
const setOptionalOverrideField = <
  Override extends MoveOverride,
  Key extends keyof Override,
>(
  move: Move,
  location: MoveOverrideLocation<Override>,
  key: Key,
  value: Override[Key] | undefined,
): Move => {
  const next: Override = { ...location.createEmpty(), ...location.read(move) };
  if (value === undefined) {
    Reflect.deleteProperty(next, key);
  } else {
    next[key] = value;
  }
  return location.write(move, next);
};

/** 共鳴差分のフィールドを更新する。undefined ならキーごと削除。 */
export const setOptionalResonanceField = <Key extends keyof MoveOverride>(
  move: Move,
  key: Key,
  value: MoveOverride[Key] | undefined,
): Move => setOptionalOverrideField(move, RESONANCE_LOCATION, key, value);

/**
 * ジャスト入力差分のフィールドを更新する。undefined ならキーごと削除。
 * resonance（共鳴中だけ別値になる場合の入れ子差分）は setOptionalJustInputResonanceField を使う。
 */
export const setOptionalJustInputField = <Key extends keyof JustInputOverride>(
  move: Move,
  key: Key,
  value: JustInputOverride[Key] | undefined,
): Move => setOptionalOverrideField(move, JUST_INPUT_LOCATION, key, value);

/** ジャスト入力の「共鳴中は別値」差分のフィールドを更新する。undefined ならキーごと削除。 */
export const setOptionalJustInputResonanceField = <Key extends keyof MoveOverride>(
  move: Move,
  key: Key,
  value: MoveOverride[Key] | undefined,
): Move =>
  setOptionalOverrideField(move, JUST_INPUT_RESONANCE_LOCATION, key, value);

/** 共鳴差分 ON/OFF を切り替える。OFF にすると resonance を完全に削除。 */
export const toggleResonance = (move: Move, enabled: boolean): Move => ({
  ...move,
  resonance: enabled ? (move.resonance ?? {}) : undefined,
});

/** ジャスト入力差分 ON/OFF を切り替える。OFF にすると justInput を完全に削除。 */
export const toggleJustInput = (move: Move, enabled: boolean): Move => ({
  ...move,
  justInput: enabled ? (move.justInput ?? {}) : undefined,
});

/**
 * 「共鳴中はジャストも別値になる」ON/OFF を切り替える。
 * OFF にすると justInput.resonance を削除（共鳴中も通常時のジャスト値を使う扱いに戻る）。
 * ジャスト入力自体は既に ON の前提で呼ぶ。
 */
export const toggleJustInputResonance = (move: Move, enabled: boolean): Move => ({
  ...move,
  justInput: {
    ...move.justInput,
    resonance: enabled ? (move.justInput?.resonance ?? {}) : undefined,
  },
});

/** 共鳴差分の hitBreakdown を更新する。 */
export const setResonanceHitBreakdown = (
  move: Move,
  entries: HitBreakdownEntry[] | undefined,
): Move => setHitBreakdownWith(move, entries, setOptionalResonanceField);

/** ジャスト入力差分の hitBreakdown を更新する。 */
export const setJustInputHitBreakdown = (
  move: Move,
  entries: HitBreakdownEntry[] | undefined,
): Move => setHitBreakdownWith(move, entries, setOptionalJustInputField);

/** ジャスト入力の「共鳴中は別値」差分の hitBreakdown を更新する。 */
export const setJustInputResonanceHitBreakdown = (
  move: Move,
  entries: HitBreakdownEntry[] | undefined,
): Move =>
  setHitBreakdownWith(move, entries, setOptionalJustInputResonanceField);

/** ジャスト入力の受付フレーム範囲を更新する。undefined なら未計測扱いで削除。 */
export const setJustInputAcceptFrames = (
  move: Move,
  range: JustInputAcceptFrames | undefined,
): Move => setOptionalJustInputField(move, "acceptFrames", range);
