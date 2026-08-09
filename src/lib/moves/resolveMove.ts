import { HIT_BREAKDOWN_NUMERIC_KEYS } from "@/lib/moves/moveEnums";
import {
  hitBreakdownDefines,
  isBaseDamageMultiHit,
  isHitBreakdownShadowedBy,
} from "@/lib/moves/moveRules";
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
export interface OverridableMove {
  resonance?: MoveOverride;
  justInput?: JustInputOverride;
  fieldPhase?: FieldPhaseOverride;
}

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
 * 上書き層を 1 つ適用する。
 *
 * ヒット内訳（hitBreakdown）と数値項目の単一値は同じ項目を二重に表せるため、単純な代入だと
 * 「技単位の内訳」と「フィールドフェイズの単一値」のように別々の層へ残り、どちらが実効値か
 * 決まらない。層には適用順（後ろほど優先）があるので、後から来た側を残して負けた側を落とす。
 *
 * - 上書きが内訳を持つ場合: それまでの層の単一値のうち、新しい内訳が定義する項目を落とす。
 * - 上書きが単一値を持つ場合: それまでの内訳が同じ項目を定義していれば、内訳ごと落とす。
 *   単一値は1ヒット分の値でヒット構造そのものが変わったことを表す（例: DP は内訳で多段、
 *   FP は単発）ため、その状態では内訳全体が前提を失う。内訳が定義していない項目だけを
 *   上書きした場合は衝突しないので内訳は残る。
 *
 * 同じ層が内訳と単一値の両方で同じ項目を定義した場合だけは適用順で決められないため、
 * スキーマ検証（hitBreakdownRefinements）が入力の時点で拒否する。
 */
const applyOverrideLayer = (
  resolved: Move,
  override: MoveOverrideValues,
): Move => {
  const applied: Move = { ...resolved, ...override };
  if (override.hitBreakdown !== undefined) {
    for (const key of HIT_BREAKDOWN_NUMERIC_KEYS) {
      if (hitBreakdownDefines(override.hitBreakdown, key)) {
        Reflect.deleteProperty(applied, key);
      }
    }
    return applied;
  }
  if (isHitBreakdownShadowedBy(override, resolved.hitBreakdown)) {
    Reflect.deleteProperty(applied, "hitBreakdown");
  }
  return applied;
};

/**
 * 共鳴・ジャスト入力の状態を解決し、その状態での実効値を持つ技を返す。
 * 各上書き層は「その層が定義したフィールドだけ」を差し替える加算的な適用で、
 * これにより「共鳴でダメージが伸びる技が、ジャスト入力でさらに伸びる／共鳴中のジャストだけ
 * 別の値になる」といった、共鳴とジャスト入力の組み合わせ差分を表現できる。
 * 上書きが1つも無ければ元の技をそのまま返す。
 * ヒット内訳と単一値のように同じ項目を二重に表せる組み合わせだけは、単純な差し替えでは
 * 決着しないため applyOverrideLayer が適用順で勝敗を決める。
 *
 * もう1つの例外は合計ダメージ（totalDamage）で、加算的な適用では「DP は多段ヒットで合計ダメージを持つが
 * FP は単発」といった技で、単発になった状態にも多段時の合計ダメージが引き継がれてしまう。
 * 合計ダメージは多段ヒット技のためだけの実測値（totalDamageRefinements 参照）なので、
 * 解決後の基礎ダメージが多段でない状態では落とす。
 */
export const resolveMove = (move: Move, state: MoveState): Move => {
  const resolved = moveOverrideLayers(move, state).reduce<Move>(
    (accumulated, layer) => applyOverrideLayer(accumulated, layer.override),
    move,
  );
  if (
    resolved.totalDamage === undefined ||
    isBaseDamageMultiHit(resolved.baseDamage, resolved.hitBreakdown)
  ) {
    return resolved;
  }
  const { totalDamage, ...withoutTotalDamage } = resolved;
  return withoutTotalDamage;
};
