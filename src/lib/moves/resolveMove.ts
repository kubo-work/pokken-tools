import type {
  JustInputOverride,
  Move,
  MoveOverride,
  ResonanceState,
} from "@/types/move";

/** 技の状態解決に使う軸。共鳴とジャスト入力は直交する（互いに独立して ON/OFF できる）。 */
export interface MoveState {
  resonance: ResonanceState;
  justInput: boolean;
}

/** ジャスト入力が常に OFF、共鳴が指定状態の MoveState。攻撃側のように片方の軸しか使わない箇所向け。 */
export const moveStateOf = (resonance: ResonanceState): MoveState => ({
  resonance,
  justInput: false,
});

/** 上書き層1つ分。差分の中身と、それが Move のどこにあるか（報告先パス）・条件の表示名。 */
export interface MoveOverrideLayer {
  /** Move のルートからの位置。スキーマ検証のエラー報告先に使う。 */
  path: (string | number)[];
  /** 「共鳴時」など、その層が表す条件の表示名。 */
  label: string;
  override: MoveOverride;
}

/** 上書き層を持つ技。Move そのものと、スキーマ検証中の未確定な技の両方を受けられるようにする。 */
interface OverridableMove {
  resonance?: MoveOverride;
  justInput?: JustInputOverride;
}

/** 層の同一性判定に使うキー。path が位置を一意に表す。 */
const layerKeyOf = (layer: MoveOverrideLayer): string => layer.path.join(".");

/**
 * その状態で効く上書き層を、適用順（後ろの層ほど優先）で返す。
 *
 * 共鳴とジャスト入力の適用順はこの関数だけが知っている。実効値の算出・表示用の差分算出・
 * スキーマ検証はいずれもここから層を受け取ることで、順序の知識が分散して食い違うのを防ぐ。
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
 * ジャスト入力版を通常版と区別するための表示用キー。
 * 技一覧の行キー・リンク先アンカーと、詳細ページの列キー・アンカー id が同じ文字列になるよう、
 * 生成をここに集約する（ズレるとアンカーリンクが着地しなくなる）。
 */
export const justInputColumnKey = (moveId: string): string => `${moveId}-just`;

const JUST_INPUT_NORMAL_STATE: MoveState = {
  resonance: "normal",
  justInput: true,
};
const JUST_INPUT_RESONANCE_STATE: MoveState = {
  resonance: "resonance",
  justInput: true,
};

/**
 * ジャスト入力版の技を、一覧・詳細ページで別行／別列として表示するために作る。
 * move.justInput が無ければ undefined（ジャスト入力による差分がない技）。
 *
 * 本体は通常時のジャスト入力を解決した値、resonance フィールドには「ジャスト入力版が
 * 共鳴でどう変わるか」を詰め替える。こうすることで、既存の共鳴「→」表示ロジック
 * （moveDetailRows 等）をそのまま使い回しつつ、表示値と resolveMove の計算結果が一致する。
 */
export const resolveJustInputMove = (move: Move): Move | undefined => {
  if (move.justInput === undefined) {
    return undefined;
  }
  return {
    ...resolveMove(move, JUST_INPUT_NORMAL_STATE),
    resonance: overrideBetweenStates(
      move,
      JUST_INPUT_NORMAL_STATE,
      JUST_INPUT_RESONANCE_STATE,
    ),
  };
};
