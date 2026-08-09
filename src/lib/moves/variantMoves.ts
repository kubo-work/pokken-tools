import {
  type MoveOverrideLayer,
  type MoveState,
  type OverridableMove,
  moveOverrideLayers,
  resolveMove,
} from "@/lib/moves/resolveMove";
import type { Move, MoveOverride, UsagePhase } from "@/types/move";

/**
 * 1 つの技から派生する「変種」（ジャスト入力版・フィールドフェイズ版）の技オブジェクトと、
 * それらを表示上で識別するキーの組み立て。
 *
 * 状態そのものの解決（どの層がどの順で効くか）は resolveMove が担い、ここはその結果を
 * 一覧の行・詳細ページの列として並べられる形に詰め替えることだけを担当する。
 */

/** 層の同一性判定に使うキー。path が位置を一意に表す。 */
const layerKeyOf = (layer: MoveOverrideLayer): string => layer.path.join(".");

/**
 * 状態 from から状態 to へ移るときに現れる差分を、絶対値の上書きとして返す。変化が無ければ undefined。
 *
 * to の層を適用順に畳み込むが、from の実効値に既に含まれる層はその分を差分から取り除く。
 * これにより「ジャスト入力で既に上書き済みのフィールドは、共鳴でも変化しない」といった
 * 打ち消しが、適用順を直接書かずに導かれる。
 *
 * from と to は同じフェイズであること。フェイズを跨いで呼ぶとフェイズ層が打ち消されず、
 * フェイズ固有の項目（command）が共鳴差分として混ざる。現在の呼び出しはいずれも
 * 共鳴・ジャスト入力の軸だけを動かしており、この前提を満たす。
 */
const overrideBetweenStates = (
  move: OverridableMove,
  from: MoveState,
  to: MoveState,
): MoveOverride | undefined => {
  const appliedInFrom = new Set(
    moveOverrideLayers(move, from).map((layer) => layerKeyOf(layer)),
  );
  let delta: MoveOverride = {};
  for (const layer of moveOverrideLayers(move, to)) {
    if (!appliedInFrom.has(layerKeyOf(layer))) {
      delta = { ...delta, ...layer.override };
      continue;
    }
    const withoutShadowed: MoveOverride = { ...delta };
    for (const key of Object.keys(layer.override)) {
      Reflect.deleteProperty(withoutShadowed, key);
    }
    delta = withoutShadowed;
  }
  return Object.keys(delta).length === 0 ? undefined : delta;
};

/**
 * 1 つの技から派生する表示上の列（フェイズ差・ジャスト入力）の識別。
 * 技本体そのものの列は phase="duel" / justInput=false で表す。
 */
export interface MoveColumnVariant {
  phase: UsagePhase;
  justInput: boolean;
}

/**
 * 変種列を互いに区別するための表示用キー。
 * 技一覧の行キー・リンク先アンカーと、詳細ページの列キー・アンカー id が同じ文字列になるよう、
 * 生成をここに集約する（ズレるとアンカーリンクが着地しなくなる）。
 * フェイズ差もジャスト入力も無い列は技 ID そのものを返し、既存のアンカーと互換を保つ。
 */
export const moveColumnKey = (
  moveId: string,
  { phase, justInput }: MoveColumnVariant,
): string => {
  const phaseKey = phase === "field" ? `${moveId}-field` : moveId;
  return justInput ? `${phaseKey}-just` : phaseKey;
};

/**
 * ジャスト入力 ON・通常時の MoveState。moveStateOf（ジャスト入力を常に OFF にする）と対になり、
 * ジャスト入力側の状態の組み立てをこの 1 箇所に閉じ込める（管理画面の差分パネルも参照する）。
 */
export const justInputNormalStateOf = (phase: UsagePhase): MoveState => ({
  resonance: "normal",
  justInput: true,
  phase,
});
/** ジャスト入力 ON・共鳴中の MoveState。 */
export const justInputResonanceStateOf = (phase: UsagePhase): MoveState => ({
  resonance: "resonance",
  justInput: true,
  phase,
});

/**
 * ジャスト入力版の技を、一覧・詳細ページで別行／別列として表示するために作る。
 * move.justInput が無ければ undefined（ジャスト入力による差分がない技）。
 * phase は表示中の文脈（DP 表示中の行なら "duel"、FP 表示中の行なら "field"）を渡す。
 * フィールドフェイズの上書き（fieldPhase）はジャスト入力より弱い層のため、phase="field"
 * を渡すとジャスト入力版にもフィールドフェイズの上書きが自動的に反映される。
 *
 * 本体は指定フェイズ・通常時のジャスト入力を解決した値、resonance フィールドには
 * 「ジャスト入力版が共鳴でどう変わるか」を詰め替える。こうすることで、既存の共鳴「→」
 * 表示ロジック（components/moveDetail 配下の行定義など）をそのまま使い回しつつ、表示値と
 * resolveMove の計算結果が一致する。
 */
export const resolveJustInputMove = (
  move: Move,
  phase: UsagePhase,
): Move | undefined => {
  if (move.justInput === undefined) {
    return undefined;
  }
  return {
    ...resolveMove(move, justInputNormalStateOf(phase)),
    resonance: overrideBetweenStates(
      move,
      justInputNormalStateOf(phase),
      justInputResonanceStateOf(phase),
    ),
  };
};

const FIELD_PHASE_NORMAL_STATE: MoveState = {
  resonance: "normal",
  justInput: false,
  phase: "field",
};
const FIELD_PHASE_RESONANCE_STATE: MoveState = {
  resonance: "resonance",
  justInput: false,
  phase: "field",
};

/**
 * フィールドフェイズ版の技を、共通技の詳細ページで別列として表示するために作る。
 * move.fieldPhase が無ければ undefined（フェイズによる性能差がない技）。
 *
 * resolveJustInputMove と対称の作りで、本体は FP 通常時の解決値、resonance フィールドには
 * 「FP版が共鳴でどう変わるか」を詰め替える。
 */
export const resolveFieldPhaseMove = (move: Move): Move | undefined => {
  if (move.fieldPhase === undefined) {
    return undefined;
  }
  return {
    ...resolveMove(move, FIELD_PHASE_NORMAL_STATE),
    resonance: overrideBetweenStates(
      move,
      FIELD_PHASE_NORMAL_STATE,
      FIELD_PHASE_RESONANCE_STATE,
    ),
  };
};
