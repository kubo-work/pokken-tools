import type { z } from "zod";
import { validateAttackFields } from "./attackRefinements";
import {
  validateActiveUntilFrame,
  validateProjectileNullify,
} from "./frameRefinements";
import { validateHitBreakdownExclusions } from "./hitBreakdownRefinements";
import type { MoveInput } from "./moveObject";
import { validateVariantRelation } from "./variantRefinements";

/**
 * 技のフィールド同士の整合性検証。個々のフィールドの形は moveObject が保証済みで、
 * ここでは「組み合わせとして成立するか」だけを見る。
 *
 * 検証規則そのものは変更理由ごとに分けてあり（属性・フレーム・ヒット内訳・変種）、
 * このファイルは適用する規則の一覧だけを持つ。層をまたぐ検証が使う共通基盤は
 * refinementLayers にある。
 */
export const validateMove = (move: MoveInput, ctx: z.RefinementCtx): void => {
  validateAttackFields(move, ctx);
  validateProjectileNullify(move, ctx);
  validateHitBreakdownExclusions(move, ctx);
  validateVariantRelation(move, ctx);
  validateActiveUntilFrame(move, ctx);
};
