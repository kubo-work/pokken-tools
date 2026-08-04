import type { HitBreakdownEntry, Move } from "@/types/move";
import {
  HIT_BREAKDOWN_DAMAGE_KEYS,
  type HitBreakdownDamageKey,
} from "./moveEnums";
import { hitBreakdownDefines } from "./moveRules";
import { setOptionalMoveField } from "./moveUpdaters";

/**
 * ヒット内訳（HitBreakdownEntry[]）を編集する純粋関数群。
 * 技のフィールドを差し替える moveUpdaters と違い、グループ配列そのものの操作を扱う。
 * 多くは Move を受け取らず配列だけを入出力するため、責務としても別に置く。
 */

/** ヒット内訳の初期値（グループ×1）。ON にしたときに使う。 */
const createDefaultHitBreakdown = (): HitBreakdownEntry[] => [{ hitCount: 1 }];

/**
 * ヒット内訳 ON/OFF を切り替える。ON は既存内容があれば維持し、無ければ既定の1グループで初期化。
 * OFF は undefined（削除）。Move / ResonanceOverride どちらの hitBreakdown にも使える。
 */
export const toggleHitBreakdown = (
  entries: HitBreakdownEntry[] | undefined,
  enabled: boolean,
): HitBreakdownEntry[] | undefined =>
  enabled ? (entries ?? createDefaultHitBreakdown()) : undefined;

/**
 * ヒット内訳の1グループ・1フィールドを更新する。undefined ならキーごと削除する
 * （setOptionalMoveField / setOptionalResonanceField と同じ「省略＝未計測」の規約）。
 */
export const setHitBreakdownEntryField = <Key extends keyof HitBreakdownEntry>(
  entries: HitBreakdownEntry[],
  index: number,
  key: Key,
  value: HitBreakdownEntry[Key] | undefined,
): HitBreakdownEntry[] =>
  entries.map((entry, entryIndex) => {
    if (entryIndex !== index) {
      return entry;
    }
    const next: HitBreakdownEntry = { ...entry };
    if (value === undefined) {
      Reflect.deleteProperty(next, key);
    } else {
      next[key] = value;
    }
    return next;
  });

/** ヒット内訳にグループを1つ追加する。 */
export const addHitBreakdownEntry = (
  entries: HitBreakdownEntry[],
): HitBreakdownEntry[] => [...entries, { hitCount: 1 }];

/**
 * ヒット内訳から指定インデックスのグループを削除する。
 * スキーマ上グループは1以上必須のため、1個のときは呼び出し側で削除ボタンを disable すること。
 */
export const removeHitBreakdownEntry = (
  entries: HitBreakdownEntry[],
  index: number,
): HitBreakdownEntry[] =>
  entries.filter((_, entryIndex) => entryIndex !== index);

/**
 * hitBreakdown といずれかの単一値フィールドが同時設定にならないよう、
 * entries が新たに定義したダメージ系キー（相互排他の対象）を返す。
 */
const conflictingDamageKeys = (
  entries: HitBreakdownEntry[] | undefined,
): HitBreakdownDamageKey[] =>
  HIT_BREAKDOWN_DAMAGE_KEYS.filter((key) => hitBreakdownDefines(entries, key));

/**
 * hitBreakdown を更新しつつ、新たに内訳が定義したダメージ系フィールドの単一値を削除する。
 * schema の相互排他ルール（内訳と単一値は併用不可）を UI 側でも満たすための共通処理で、
 * 技単位・各条件付き差分のどこに書くかは setField の差し替えで表す。
 */
export const setHitBreakdownWith = (
  move: Move,
  entries: HitBreakdownEntry[] | undefined,
  setField: (
    move: Move,
    key: "hitBreakdown" | HitBreakdownDamageKey,
    value: HitBreakdownEntry[] | undefined,
  ) => Move,
): Move => {
  let next = setField(move, "hitBreakdown", entries);
  for (const key of conflictingDamageKeys(entries)) {
    next = setField(next, key, undefined);
  }
  return next;
};

/** 技単位の hitBreakdown を更新する。 */
export const setMoveHitBreakdown = (
  move: Move,
  entries: HitBreakdownEntry[] | undefined,
): Move => setHitBreakdownWith(move, entries, setOptionalMoveField);
