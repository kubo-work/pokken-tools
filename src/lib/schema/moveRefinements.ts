import type { z } from "zod";
import {
  ATTACK_TYPE_META,
  HIT_BREAKDOWN_DAMAGE_KEYS,
  type HitBreakdownDamageKey,
  STRENGTH_RANGE_BY_ATTACK_TYPE,
  hitBreakdownDefines,
} from "@/lib/meta";
import { type MoveState, moveOverrideLayers } from "@/lib/moves/resolveMove";
import type { HitBreakdownEntry } from "@/types/move";
import type { MoveInput } from "./moveObject";

/**
 * 技のフィールド同士の整合性検証。個々のフィールドの形は moveObject が保証済みで、
 * ここでは「組み合わせとして成立するか」だけを見る。
 */

/** 属性・攻撃属性を持たない技が、持てないはずの項目を持っていないか。 */
const validateNonAttackFields = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  if (move.strength !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["strength"],
      message: "攻撃属性を持たない技に強度は設定できません",
    });
  }
  if (move.guardLevel !== null) {
    ctx.addIssue({
      code: "custom",
      path: ["guardLevel"],
      message: "攻撃属性を持たない技に判定は設定できません",
    });
  }
  if (hitBreakdownDefines(move.hitBreakdown, "guardLevel")) {
    ctx.addIssue({
      code: "custom",
      path: ["hitBreakdown"],
      message: "攻撃属性を持たない技のヒット内訳に判定は設定できません",
    });
  }
  if (move.resonanceFlinch !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["resonanceFlinch"],
      message: "攻撃属性を持たない技に共鳴怯ませ強度は設定できません",
    });
  }
};

/** 攻撃属性を持つ技の強度が、属性ごとの範囲に収まっているか（条件付き差分も含む）。 */
const validateStrengthRange = (
  move: MoveInput,
  attackType: NonNullable<MoveInput["attackType"]>,
  ctx: z.RefinementCtx,
): void => {
  const range = STRENGTH_RANGE_BY_ATTACK_TYPE[attackType];
  const attackTypeLabel = ATTACK_TYPE_META[attackType].label;
  if (move.strength === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["strength"],
      message: `${attackTypeLabel}技は強度（${range.min}〜${range.max}）が必須です`,
    });
  } else if (move.strength < range.min || move.strength > range.max) {
    ctx.addIssue({
      code: "custom",
      path: ["strength"],
      message: `${attackTypeLabel}技の強度は${range.min}〜${range.max}で入力してください`,
    });
  }
  const overrides: {
    path: (string | number)[];
    value: number | undefined;
    label: string;
  }[] = [
    { path: ["resonance", "strength"], value: move.resonance?.strength, label: "共鳴中の強度" },
    { path: ["justInput", "strength"], value: move.justInput?.strength, label: "ジャスト入力時の強度" },
    {
      path: ["justInput", "resonance", "strength"],
      value: move.justInput?.resonance?.strength,
      label: "共鳴中のジャスト入力時の強度",
    },
  ];
  for (const override of overrides) {
    if (
      override.value !== undefined &&
      (override.value < range.min || override.value > range.max)
    ) {
      ctx.addIssue({
        code: "custom",
        path: override.path,
        message: `${override.label}は${range.min}〜${range.max}で入力してください`,
      });
    }
  }
};

/** 属性・攻撃属性と、それに紐づく項目（強度・判定・共鳴怯ませ）の相関。 */
const validateAttackFields = (move: MoveInput, ctx: z.RefinementCtx): void => {
  if (move.category === undefined && move.attackType !== undefined) {
    // 属性を持たない技は攻撃しないため攻撃属性も持たない。
    ctx.addIssue({
      code: "custom",
      path: ["attackType"],
      message: "属性を持たない技に攻撃属性は設定できません",
    });
  }
  if (move.attackType === undefined) {
    validateNonAttackFields(move, ctx);
    return;
  }
  validateStrengthRange(move, move.attackType, ctx);
};

/** 弾消し開始フレームは特殊属性「弾消し」を持つ技にだけ設定できる。 */
const validateProjectileNullify = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  if (
    move.projectileNullifyStartFrame !== undefined &&
    !(move.specialAttributes?.includes("projectileNullify") ?? false)
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["projectileNullifyStartFrame"],
      message: "弾消し開始フレームは特殊属性「弾消し」を持つ技にのみ設定できます",
    });
  }
};

/** 検証で参照する層。技本体と各上書き層を同じ形に揃えて扱う。 */
interface ValidationLayer {
  path: (string | number)[];
  label: string;
  values: {
    hitBreakdown?: HitBreakdownEntry[];
  } & { [Key in HitBreakdownDamageKey]?: unknown };
}

/** 検証対象の状態。共鳴×ジャスト入力の全4通り。 */
const VALIDATED_STATES: MoveState[] = [
  { resonance: "normal", justInput: false },
  { resonance: "resonance", justInput: false },
  { resonance: "normal", justInput: true },
  { resonance: "resonance", justInput: true },
];

/**
 * その状態で効く層を、技本体を先頭にして適用順に並べる。
 * 上書き層の順序は resolveMove と同じ定義（moveOverrideLayers）を使うため、
 * 適用順を変えても検証側だけ古い前提が残ることがない。
 */
const validationLayersOf = (
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
const effectiveLayer = (
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

/**
 * ヒット内訳とダメージ系の単一値は併用できない（どちらが実効値か決まらないため）。
 *
 * 所有者ごとの組み合わせを列挙すると条件軸が増えるたびに漏れるので、resolveMove と同じ
 * 適用順で4状態それぞれの実効値を求め、「その状態で内訳と単一値が同居していないか」だけを見る。
 * 同じ指摘が複数状態から出るため、報告先（path + キー）で重複を除く。
 */
const validateHitBreakdownExclusions = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  const reported = new Set<string>();
  for (const state of VALIDATED_STATES) {
    const layers = validationLayersOf(move, state);
    const breakdownLayer = effectiveLayer(
      layers,
      (layer) => layer.values.hitBreakdown !== undefined,
    );
    if (breakdownLayer === undefined) {
      continue;
    }
    for (const key of HIT_BREAKDOWN_DAMAGE_KEYS) {
      if (!hitBreakdownDefines(breakdownLayer.values.hitBreakdown, key)) {
        continue;
      }
      const valueLayer = effectiveLayer(
        layers,
        (layer) => layer.values[key] !== undefined,
      );
      if (valueLayer === undefined) {
        continue;
      }
      const path = [...valueLayer.path, key];
      const reportKey = path.join(".");
      if (reported.has(reportKey)) {
        continue;
      }
      reported.add(reportKey);
      ctx.addIssue({
        code: "custom",
        path,
        message: `${breakdownLayer.label}のヒット内訳で設定済みの項目は、${valueLayer.label}の単一値と併用できません`,
      });
    }
  }
};

/** ため・派生の親子関係と、ため段階の設定先。 */
const validateVariantRelation = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
  const isChildVariant =
    move.variant === "charge" || move.variant === "derivative";
  if (isChildVariant && move.parentMoveId === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["parentMoveId"],
      message: "ため・派生技は親技 ID が必須です",
    });
  }
  if (!isChildVariant && move.parentMoveId !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["parentMoveId"],
      message: "通常技に親技 ID は設定できません",
    });
  }
  if (move.chargeLevel !== undefined && move.variant !== "charge") {
    ctx.addIssue({
      code: "custom",
      path: ["chargeLevel"],
      message: "ため段階はため技 (charge) にのみ設定できます",
    });
  }
  // 通常技には「1つ前の段」が存在しないため、割り込みフレームは値の意味が定まらない。
  if (move.guardInterruptFrames !== undefined && !isChildVariant) {
    ctx.addIssue({
      code: "custom",
      path: ["guardInterruptFrames"],
      message: "ガード割り込みはため・派生技にのみ設定できます",
    });
  }
};

/** 技のフィールド同士の整合性をまとめて検証する。 */
export const validateMove = (move: MoveInput, ctx: z.RefinementCtx): void => {
  validateAttackFields(move, ctx);
  validateProjectileNullify(move, ctx);
  validateHitBreakdownExclusions(move, ctx);
  validateVariantRelation(move, ctx);
};
