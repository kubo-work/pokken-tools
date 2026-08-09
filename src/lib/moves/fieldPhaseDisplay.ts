import { isHitBreakdownShadowedBy } from "@/lib/moves/moveRules";
import type { FieldPhaseOverride, Move } from "@/types/move";

/**
 * FP で性能が変わる技を DP/FP 2 つに並べて表示するときの、セル結合の判定。
 *
 * 技詳細ページは 列=変種・行=項目 なので DP/FP は横に並び colSpan で、
 * 技一覧は 行=技・列=項目 なので縦に並び rowSpan で結合する。向きは違うが
 * 「そのセルが両フェイズで必ず同じ値になるか」の判定は同じなので、ここに集約する。
 */

/** その技の fieldPhase が実際に変更している項目。差が無ければ空配列。 */
const ownDiffKeysOf = (move: Move): (keyof FieldPhaseOverride)[] =>
  Object.keys(move.fieldPhase ?? {}) as (keyof FieldPhaseOverride)[];

/** 既に含まれているキーは重ねず、無ければ足した新しい配列を返す。 */
const withKey = (
  keys: (keyof FieldPhaseOverride)[],
  key: keyof FieldPhaseOverride,
): (keyof FieldPhaseOverride)[] =>
  keys.includes(key) ? keys : [...keys, key];

/**
 * その技の表示がフェイズで変わる項目。
 *
 * 自身の fieldPhase に加え、親のコマンドがフェイズで変わる場合は自身の command も含める。
 * ため/派生の表示コマンドは「親コマンド＋追加入力」で組み立てるため、自身の fieldPhase が
 * command を持たなくても表示は変わるため（これを見落とすと、値が違うセルを結合してしまう）。
 *
 * 同じ理由で、単一値が技単位の内訳を打ち消す技には hitBreakdown を含める。FP では内訳が
 * 丸ごと効かなくなり（isHitBreakdownShadowedBy 参照）、内訳由来のセルはダメージも
 * PCH 値も DP と値が変わるため、内訳そのものを差し替えた技と同じ扱いにする。
 *
 * @param parentFieldPhaseCommand 親技の fieldPhase.command。親技自身や、親のコマンドが
 *   フェイズで変わらない場合は undefined。
 */
export const fieldPhaseDiffKeysOf = (
  move: Move,
  parentFieldPhaseCommand: string | undefined,
): (keyof FieldPhaseOverride)[] => {
  const ownKeys = ownDiffKeysOf(move);
  const keys = isHitBreakdownShadowedBy(move.fieldPhase, move.hitBreakdown)
    ? withKey(ownKeys, "hitBreakdown")
    : ownKeys;
  return parentFieldPhaseCommand === undefined
    ? keys
    : withKey(keys, "command");
};

/**
 * あるセルの表示が DP/FP で必ず同じ値になるか。真なら 1 セルに結合できる。
 *
 * dependentKeys にはそのセルの表示が読む項目を渡す。fieldPhase がそれらを 1 つも
 * 変更していなければ、両フェイズの表示は必ず一致する。
 *
 * ヒット内訳 (hitBreakdown) だけは例外で、ダメージ・判定・空地の表示を横断的に変えるため
 * セルごとの申告に頼らず、変更されていたら一切結合しない（誤って結合して嘘の値を
 * 見せるより、重複して表示するほうが安全）。
 */
export const isPhaseInvariantCell = (
  fieldPhaseDiffKeys: (keyof FieldPhaseOverride)[],
  dependentKeys: (keyof FieldPhaseOverride)[],
): boolean => {
  if (fieldPhaseDiffKeys.includes("hitBreakdown")) {
    return false;
  }
  return !dependentKeys.some((key) => fieldPhaseDiffKeys.includes(key));
};
