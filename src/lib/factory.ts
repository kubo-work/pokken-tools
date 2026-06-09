import type { Move, MoveVariant, Phase } from "@/types/move";

/** ID 生成のサフィックス長（16進文字列）。 */
const ID_SUFFIX_LENGTH = 6;

/** 実測値が入るまでの暫定のガード硬直差（攻撃側不利側を仮置き）。実値が入ったら個別に上書きする。 */
export const DEFAULT_GUARD_FRAME_ADVANTAGE = -20;

const VARIANT_ID_INFIX: Record<Exclude<MoveVariant, "normal">, string> = {
  charge: "chg",
  derivative: "drv",
};

const randomSuffix = (): string =>
  Math.random().toString(16).slice(2, 2 + ID_SUFFIX_LENGTH);

export interface CreateMoveOptions {
  /** 親技 (charge/derivative) として作る場合の variant。省略時は normal。 */
  variant?: Exclude<MoveVariant, "normal">;
  /** variant 指定時は親 Move の id を渡す。 */
  parentMoveId?: string;
}

/**
 * 新規技の初期値を生成する。ID は例外設定から参照されるため、生成後は変更しない前提。
 * options 指定時は ID を親 ID 由来 (`{parentId}_drv_xxxxxx`) にして親子関係を ID からも追えるようにする。
 */
export const createMove = (
  characterId: string,
  phase: Phase,
  options?: CreateMoveOptions,
): Move => {
  const suffix = randomSuffix();
  const isChild =
    options?.variant !== undefined && options.parentMoveId !== undefined;
  const id = isChild
    ? `${options.parentMoveId}_${VARIANT_ID_INFIX[options.variant!]}_${suffix}`
    : `${characterId}_${phase}_${suffix}`;
  return {
    id,
    name: "",
    command: "",
    category: "attack",
    attackType: "strike",
    guardLevel: "mid",
    startup: 0,
    guardFrameAdvantage: DEFAULT_GUARD_FRAME_ADVANTAGE,
    strength: "weak",
    ...(isChild
      ? { variant: options.variant, parentMoveId: options.parentMoveId }
      : {}),
    // ため技は最小段階から始める。複数段階にする場合は段階ごとに別の charge 技を追加する。
    ...(isChild && options.variant === "charge" ? { chargeLevel: 1 } : {}),
  };
};
