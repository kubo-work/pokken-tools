import type { Move, Phase } from "@/types/move";

/** ID 生成のサフィックス長（16進文字列）。 */
const ID_SUFFIX_LENGTH = 6;

/** 実測値が入るまでの暫定の硬直F。実値が入ったら個別に上書きする。 */
export const DEFAULT_RECOVERY_FRAMES = 20;

const randomSuffix = (): string =>
  Math.random().toString(16).slice(2, 2 + ID_SUFFIX_LENGTH);

/** 新規技の初期値を生成する。ID は例外設定から参照されるため、生成後は変更しない前提。 */
export const createMove = (characterId: string, phase: Phase): Move => ({
  id: `${characterId}_${phase}_${randomSuffix()}`,
  name: "",
  command: "",
  category: "attack",
  attackType: "strike",
  guardLevels: ["mid"],
  startup: 0,
  recovery: DEFAULT_RECOVERY_FRAMES,
  strength: "weak",
});
