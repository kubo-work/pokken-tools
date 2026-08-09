import type { z } from "zod";
import { USAGE_PHASES, type HitBreakdownDamageKey } from "@/lib/moves/moveEnums";
import { type MoveState, moveOverrideLayers } from "@/lib/moves/resolveMove";
import type { HitBreakdownEntry } from "@/types/move";
import type { MoveInput } from "./moveObject";

/**
 * 共鳴・ジャスト入力の上書き層をまたいで整合性を見る検証の共通基盤。
 * 「どの状態を見るか」「その状態で実際に効く値はどの層のものか」「同じ入力欄へ
 * 重複した指摘を出さないか」だけを担い、個々の検証規則そのものは持たない。
 */

/** 検証で参照する層。技本体と各上書き層を同じ形に揃えて扱う。 */
export interface ValidationLayer {
  path: (string | number)[];
  label: string;
  /** 層をまたいで突き合わせる必要があるフィールドだけを並べる。 */
  values: {
    hitBreakdown?: HitBreakdownEntry[];
    startup?: number;
    activeUntilFrame?: number;
  } & { [Key in HitBreakdownDamageKey]?: unknown };
}

/**
 * 検証対象の状態。フェイズ×共鳴×ジャスト入力の全8通り。
 * fieldPhase を持たない技（大半）では phase="field" の4状態がフェイズ層を素通りするだけなので、
 * 実効値の出所（effectiveLayer）は phase="duel" のときと変わらず、指摘の重複は
 * createPathIssueReporter が吸収する。
 */
export const VALIDATED_STATES: MoveState[] = USAGE_PHASES.flatMap((phase) => [
  { resonance: "normal", justInput: false, phase },
  { resonance: "resonance", justInput: false, phase },
  { resonance: "normal", justInput: true, phase },
  { resonance: "resonance", justInput: true, phase },
]);

/**
 * その状態で効く層を、技本体を先頭にして適用順に並べる。
 * 上書き層の順序は resolveMove と同じ定義（moveOverrideLayers）を使うため、
 * 適用順を変えても検証側だけ古い前提が残ることがない。
 */
export const validationLayersOf = (
  move: MoveInput,
  state: MoveState,
): ValidationLayer[] => [
  { path: [], label: "技単位", values: move },
  ...moveOverrideLayers(move, state).map((layer) => ({
    path: layer.path,
    label: layer.label,
    values: layer.override,
  })),
];

/** その状態で実際に効く（最も後ろの層が定義した）値の出所を返す。無ければ undefined。 */
export const effectiveLayer = (
  layers: ValidationLayer[],
  isDefined: (layer: ValidationLayer) => boolean,
): ValidationLayer | undefined => {
  for (let index = layers.length - 1; index >= 0; index -= 1) {
    const layer = layers[index];
    if (layer !== undefined && isDefined(layer)) {
      return layer;
    }
  }
  return undefined;
};

/** 報告先パスごとに 1 度だけ指摘を出す関数。 */
export type PathIssueReporter = (
  path: (string | number)[],
  message: string,
) => void;

/**
 * 報告先パスごとに 1 度だけ指摘を出す addIssue を作る。
 *
 * 4状態を走査する検証では、状態が違っても実効値の出所が同じ層になることが多く、
 * 同一の入力欄へ同じ指摘が繰り返し立つ。各検証がそれぞれ重複除去の Set を持つと
 * 同じ仕組みが散らばるため、ここへ閉じ込めて呼び出し側は報告するだけにする。
 */
export const createPathIssueReporter = (
  ctx: z.RefinementCtx,
): PathIssueReporter => {
  const reportedPaths = new Set<string>();
  return (path, message) => {
    const reportKey = path.join(".");
    if (reportedPaths.has(reportKey)) {
      return;
    }
    reportedPaths.add(reportKey);
    ctx.addIssue({ code: "custom", path, message });
  };
};
