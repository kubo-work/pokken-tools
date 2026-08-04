import type {
  Move,
  MoveAttackType,
  MoveCategory,
  ResonanceFlinch,
  SpecialAttribute,
} from "@/types/move";

/**
 * 技本体のフィールドを編集する純粋関数群。コンポーネントは onChange に新しい Move を渡すだけで
 * 済むよう、部分更新ロジックはここに集約する。state も副作用も持たない。
 * 条件付き差分（共鳴・ジャスト入力）の編集は moveOverrideUpdaters、
 * ヒット内訳の配列操作は moveHitBreakdownUpdaters に分けている。
 */

/**
 * 共鳴怯ませ強度の保持形式。"transition" は「出始め弱→途中から強」で、
 * このモードのときだけ切替フレーム (switchActiveFrame) を伴う。
 * ResonanceFlinch が単一値と切替フレーム付きオブジェクトの union であることに対応する。
 */
export type ResonanceFlinchMode = "weak" | "strong" | "transition";

/** 「弱→強」で切替フレーム未指定のときの既定値（持続 1F 目から強）。 */
export const DEFAULT_SWITCH_ACTIVE_FRAME = 1;

/** 1 フィールドだけ差し替えた Move を返す。 */
export const setMoveField = <Key extends keyof Move>(
  move: Move,
  key: Key,
  value: Move[Key],
): Move => ({ ...move, [key]: value });

/** Move の省略可能キー（undefined が「無し／未計測」を表すフィールド）。 */
type OptionalMoveKey = {
  [Key in keyof Move]-?: undefined extends Move[Key] ? Key : never;
}[keyof Move];

/**
 * Move の省略可能フィールドを更新する。undefined ならキーごと削除し、
 * JSON 化したときにフィールド自体が残らないようにする（省略＝未計測の規約）。
 */
export const setOptionalMoveField = <Key extends OptionalMoveKey>(
  move: Move,
  key: Key,
  value: Move[Key] | undefined,
): Move => {
  const next: Move = { ...move };
  if (value === undefined) {
    // OptionalMoveKey 制約で省略可能キーに限定済み。ジェネリックなキーへの
    // delete 演算子を TS が許可しないため Reflect.deleteProperty で削除する。
    Reflect.deleteProperty(next, key);
  } else {
    next[key] = value;
  }
  return next;
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

/**
 * 保持形式（弱／強／弱→強）と切替フレームから技本体の共鳴怯ませ強度を更新する。
 * mode が null なら削除、"transition" なら切替フレーム付きの値、それ以外はモード値をそのまま設定。
 * 切替フレーム未指定時は DEFAULT_SWITCH_ACTIVE_FRAME で補完する。
 */
export const setMoveResonanceFlinchMode = (
  move: Move,
  mode: ResonanceFlinchMode | null,
  switchActiveFrame: number | undefined,
): Move => {
  const resonanceFlinch: ResonanceFlinch | undefined =
    mode === null
      ? undefined
      : mode === "transition"
        ? {
            switchActiveFrame: switchActiveFrame ?? DEFAULT_SWITCH_ACTIVE_FRAME,
          }
        : mode;
  return setOptionalMoveField(move, "resonanceFlinch", resonanceFlinch);
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
  const next = setOptionalMoveField(
    move,
    "specialAttributes",
    attributes.length === 0 ? undefined : attributes,
  );
  return attributes.includes("projectileNullify")
    ? next
    : setOptionalMoveField(next, "projectileNullifyStartFrame", undefined);
};

