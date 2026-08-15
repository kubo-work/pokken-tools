import type { z } from "zod";
import type { HitBreakdownCategoricalKey } from "@/lib/moves/moveEnums";
import { formatStrengthAllowedValues } from "@/lib/moves/moveFormat";
import { ATTACK_TYPE_META } from "@/lib/moves/moveLabels";
import { hitBreakdownDefines, isStrengthAllowedFor } from "@/lib/moves/moveRules";
import type { MoveAttackType, StrengthValue } from "@/types/move";
import type { MoveInput } from "./moveObject";

/**
 * 属性（攻撃／ブロック／つかみ）・攻撃属性と、それに紐づく項目
 * （強度・判定・共鳴怯ませ強度）の整合性検証。
 */

/**
 * 強度が入力可能な値でないときの指摘文言。技単位・上書き層・ヒット内訳のどれで出しても
 * 述部は同じで、主語（「打撃技の強度」「共鳴中の強度」など）だけが変わる。
 * 値の表現（「1〜8」「1〜9・◎・●」）は formatStrengthAllowedValues（moveFormat）と共有する。
 */
const strengthNotAllowedMessage = (
  subject: string,
  attackType: MoveAttackType,
): string =>
  `${subject}は${formatStrengthAllowedValues(attackType)}で入力してください`;

/** 攻撃属性由来の主語。技単位とヒット内訳のどちらの指摘でも同じ呼び方をする。 */
const attackTypeStrengthSubject = (attackType: MoveAttackType): string =>
  `${ATTACK_TYPE_META[attackType].label}技の強度`;

/**
 * 攻撃属性を持たない技のヒット内訳に設定できない項目。技単位の単一値だけを見ていると
 * 内訳経由で同じ値を持ててしまうため、内訳側も同じ制約で塞ぐ。
 */
const NON_ATTACK_FORBIDDEN_BREAKDOWN_FIELDS: {
  key: HitBreakdownCategoricalKey;
  label: string;
}[] = [
  { key: "guardLevel", label: "判定" },
  { key: "resonanceFlinch", label: "共鳴怯ませ強度" },
  { key: "attackType", label: "攻撃属性" },
  { key: "strength", label: "強度" },
];

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
  for (const field of NON_ATTACK_FORBIDDEN_BREAKDOWN_FIELDS) {
    if (hitBreakdownDefines(move.hitBreakdown, field.key)) {
      ctx.addIssue({
        code: "custom",
        path: ["hitBreakdown"],
        message: `攻撃属性を持たない技のヒット内訳に${field.label}は設定できません`,
      });
    }
  }
  if (move.resonanceFlinch !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["resonanceFlinch"],
      message: "攻撃属性を持たない技に共鳴怯ませ強度は設定できません",
    });
  }
};

/**
 * ヒット内訳の各グループの強度が、そのグループの攻撃属性の範囲に収まっているか。
 * グループが攻撃属性を省略していれば技単位の攻撃属性を基準にする（attackType は上書き層を
 * 持たず技単位にのみ存在するため、基準は常に move.attackType 一本）。
 */
const validateHitBreakdownStrength = (
  move: MoveInput,
  attackType: NonNullable<MoveInput["attackType"]>,
  ctx: z.RefinementCtx,
): void => {
  move.hitBreakdown?.forEach((entry, index) => {
    if (entry.strength === undefined) {
      return;
    }
    const entryAttackType = entry.attackType ?? attackType;
    if (!isStrengthAllowedFor(entry.strength, entryAttackType)) {
      ctx.addIssue({
        code: "custom",
        path: ["hitBreakdown", index, "strength"],
        message: strengthNotAllowedMessage(
          attackTypeStrengthSubject(entryAttackType),
          entryAttackType,
        ),
      });
    }
  });
};

/**
 * 強度を単一値で上書きできる層。値そのものではなく move からの引き方（strengthOf）で持ち、
 * 検証関数の外に置けるようにする。攻撃属性はどの層でも変わらないため、範囲は技単位の
 * 攻撃属性で決まる（layer ごとに攻撃属性を持たない）。
 */
const STRENGTH_OVERRIDE_LAYERS: {
  path: (string | number)[];
  subject: string;
  strengthOf: (move: MoveInput) => StrengthValue | undefined;
}[] = [
  {
    path: ["resonance", "strength"],
    subject: "共鳴中の強度",
    strengthOf: (move) => move.resonance?.strength,
  },
  {
    path: ["justInput", "strength"],
    subject: "ジャスト入力時の強度",
    strengthOf: (move) => move.justInput?.strength,
  },
  {
    path: ["justInput", "resonance", "strength"],
    subject: "共鳴中のジャスト入力時の強度",
    strengthOf: (move) => move.justInput?.resonance?.strength,
  },
  {
    path: ["fieldPhase", "strength"],
    subject: "フィールドフェイズの強度",
    strengthOf: (move) => move.fieldPhase?.strength,
  },
];

/** 攻撃属性を持つ技の強度が入力可能な値か（条件付き差分も含む）。 */
const validateStrength = (
  move: MoveInput,
  attackType: NonNullable<MoveInput["attackType"]>,
  ctx: z.RefinementCtx,
): void => {
  if (move.strength === undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["strength"],
      message: `${ATTACK_TYPE_META[attackType].label}技は強度（${formatStrengthAllowedValues(attackType)}）が必須です`,
    });
  } else if (!isStrengthAllowedFor(move.strength, attackType)) {
    ctx.addIssue({
      code: "custom",
      path: ["strength"],
      message: strengthNotAllowedMessage(
        attackTypeStrengthSubject(attackType),
        attackType,
      ),
    });
  }
  for (const layer of STRENGTH_OVERRIDE_LAYERS) {
    const strength = layer.strengthOf(move);
    if (strength !== undefined && !isStrengthAllowedFor(strength, attackType)) {
      ctx.addIssue({
        code: "custom",
        path: layer.path,
        message: strengthNotAllowedMessage(layer.subject, attackType),
      });
    }
  }
};

/** 属性・攻撃属性と、それに紐づく項目（強度・判定・共鳴怯ませ）の相関。 */
export const validateAttackFields = (
  move: MoveInput,
  ctx: z.RefinementCtx,
): void => {
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
  validateStrength(move, move.attackType, ctx);
  validateHitBreakdownStrength(move, move.attackType, ctx);
};
