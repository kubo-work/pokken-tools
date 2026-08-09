import type {
  FieldPhaseOverride,
  JustInputOverride,
  Move,
  MoveOverride,
  ResonanceState,
  UsagePhase,
} from "@/types/move";

/** 技の状態解決に使う軸。共鳴・ジャスト入力は直交し、フェイズはどちらとも独立した軸。 */
export interface MoveState {
  resonance: ResonanceState;
  justInput: boolean;
  phase: UsagePhase;
}

/**
 * ジャスト入力が常に OFF、共鳴・フェイズが指定状態の MoveState。
 * 攻撃側のように一部の軸しか使わない箇所向け。
 */
export const moveStateOf = (
  resonance: ResonanceState,
  phase: UsagePhase,
): MoveState => ({
  resonance,
  justInput: false,
  phase,
});

/**
 * 上書き層が持つ差分。条件ごとに変えられる項目が違う（フェイズ差だけが command を持ち、
 * 判定を持たない）ため union で表す。
 */
type MoveOverrideValues = MoveOverride | FieldPhaseOverride;

/** 上書き層1つ分。差分の中身と、それが Move のどこにあるか（報告先パス）・条件の表示名。 */
export interface MoveOverrideLayer {
  /** Move のルートからの位置。スキーマ検証のエラー報告先に使う。 */
  path: (string | number)[];
  /** 「共鳴時」など、その層が表す条件の表示名。 */
  label: string;
  override: MoveOverrideValues;
}

/** 上書き層を持つ技。Move そのものと、スキーマ検証中の未確定な技の両方を受けられるようにする。 */
interface OverridableMove {
  resonance?: MoveOverride;
  justInput?: JustInputOverride;
  fieldPhase?: FieldPhaseOverride;
}

/** 層の同一性判定に使うキー。path が位置を一意に表す。 */
const layerKeyOf = (layer: MoveOverrideLayer): string => layer.path.join(".");

/**
 * その状態で効く上書き層を、適用順（後ろの層ほど優先）で返す。
 *
 * フェイズ・共鳴・ジャスト入力の適用順はこの関数だけが知っている。実効値の算出・
 * 表示用の差分算出・スキーマ検証はいずれもここから層を受け取ることで、順序の知識が
 * 分散して食い違うのを防ぐ。
 *
 * フェイズ層を先頭（最も弱い優先度）にするのは、「フィールドフェイズかつ共鳴時」に
 * 共鳴の効果が消えてしまう（フェイズ層が共鳴の値を上書きする）事態を避けるため。
 * 同じ項目を両方の層が定義した場合、現状は共鳴側が勝つ。
 *
 * ジャスト入力層からは acceptFrames（受付フレーム）と resonance（入れ子の差分）を除く。
 * どちらも Move の同名フィールドを上書きしてはいけないメタ情報のため。
 */
export const moveOverrideLayers = (
  move: OverridableMove,
  state: MoveState,
): MoveOverrideLayer[] => {
  const isResonance = state.resonance === "resonance";
  const layers: MoveOverrideLayer[] = [];
  if (state.phase === "field" && move.fieldPhase !== undefined) {
    layers.push({
      path: ["fieldPhase"],
      label: "フィールドフェイズ",
      override: move.fieldPhase,
    });
  }
  if (isResonance && move.resonance !== undefined) {
    layers.push({
      path: ["resonance"],
      label: "共鳴時",
      override: move.resonance,
    });
  }
  if (state.justInput && move.justInput !== undefined) {
    const { acceptFrames, resonance: justResonance, ...justBase } = move.justInput;
    layers.push({
      path: ["justInput"],
      label: "ジャスト入力時",
      override: justBase,
    });
    if (isResonance && justResonance !== undefined) {
      layers.push({
        path: ["justInput", "resonance"],
        label: "共鳴中のジャスト入力時",
        override: justResonance,
      });
    }
  }
  return layers;
};

/**
 * 共鳴・ジャスト入力の状態を解決し、その状態での実効値を持つ技を返す。
 * 各上書き層は「その層が定義したフィールドだけ」を差し替える加算的な適用で、
 * これにより「共鳴でダメージが伸びる技が、ジャスト入力でさらに伸びる／共鳴中のジャストだけ
 * 別の値になる」といった、共鳴とジャスト入力の組み合わせ差分を表現できる。
 * 上書きが1つも無ければ元の技をそのまま返す。
 */
export const resolveMove = (move: Move, state: MoveState): Move =>
  moveOverrideLayers(move, state).reduce<Move>(
    (resolved, layer) => ({ ...resolved, ...layer.override }),
    move,
  );

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

const justInputNormalStateOf = (phase: UsagePhase): MoveState => ({
  resonance: "normal",
  justInput: true,
  phase,
});
const justInputResonanceStateOf = (phase: UsagePhase): MoveState => ({
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
