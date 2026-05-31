import {
  ATTACK_TYPE_META,
  CATEGORY_META,
  GUARD_LEVELS,
  GUARD_LEVEL_META,
  MOVE_ATTACK_TYPES,
  MOVE_CATEGORIES,
  MOVE_STRENGTHS,
  STRENGTH_META,
} from "@/lib/meta";

export const CATEGORY_OPTIONS = MOVE_CATEGORIES.map((category) => ({
  value: category,
  label: CATEGORY_META[category].label,
}));

export const ATTACK_TYPE_OPTIONS = MOVE_ATTACK_TYPES.map((attackType) => ({
  value: attackType,
  label: ATTACK_TYPE_META[attackType].label,
}));

export const STRENGTH_OPTIONS = MOVE_STRENGTHS.map((strength) => ({
  value: strength,
  label: STRENGTH_META[strength].label,
}));

export const GUARD_LEVEL_OPTIONS = GUARD_LEVELS.map((level) => ({
  value: level,
  label: GUARD_LEVEL_META[level].label,
}));

export type ResonanceNumberField = "startup" | "recovery";

export const RESONANCE_NUMBER_FIELDS: {
  key: ResonanceNumberField;
  label: string;
  negative: boolean;
}[] = [
  { key: "startup", label: "発生", negative: false },
  { key: "recovery", label: "硬直F", negative: false },
];

export const toNumber = (value: number | string): number =>
  typeof value === "number" ? value : 0;
