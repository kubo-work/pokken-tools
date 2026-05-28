import type {
  GuardLevel,
  MoveCategory,
  MoveStrength,
  Phase,
  ResonanceState,
} from "@/types/move";

export const CATEGORY_META: Record<
  MoveCategory,
  { label: string; shortLabel: string; color: string }
> = {
  attack: { label: "攻撃", shortLabel: "攻", color: "#ef4444" },
  block: { label: "ブロック", shortLabel: "ブ", color: "#3b82f6" },
  grab: { label: "つかみ", shortLabel: "つ", color: "#22c55e" },
};

export const STRENGTH_META: Record<MoveStrength, { label: string }> = {
  weak: { label: "弱" },
  medium: { label: "中" },
  strong: { label: "強" },
};

export const GUARD_LEVEL_META: Record<GuardLevel, { label: string; shortLabel: string }> = {
  high: { label: "上段", shortLabel: "上" },
  mid: { label: "中段", shortLabel: "中" },
  low: { label: "下段", shortLabel: "下" },
};

export const PHASE_META: Record<Phase, { label: string; shortLabel: string }> = {
  field: { label: "フィールドフェイズ", shortLabel: "FP" },
  duel: { label: "デュエルフェイズ", shortLabel: "DP" },
};

export const RESONANCE_META: Record<ResonanceState, { label: string }> = {
  normal: { label: "通常" },
  resonance: { label: "共鳴" },
};

export const MOVE_CATEGORIES: MoveCategory[] = ["attack", "block", "grab"];
export const MOVE_STRENGTHS: MoveStrength[] = ["weak", "medium", "strong"];
export const GUARD_LEVELS: GuardLevel[] = ["high", "mid", "low"];
export const PHASES: Phase[] = ["field", "duel"];
