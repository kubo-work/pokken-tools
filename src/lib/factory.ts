import type { Move, Phase } from "@/types/move";

function randomSuffix(): string {
  return Math.random().toString(16).slice(2, 8);
}

/** 新規技の初期値を生成する。ID は例外設定から参照されるため、生成後は変更しない前提。 */
export function createMove(characterId: string, phase: Phase): Move {
  return {
    id: `${characterId}_${phase}_${randomSuffix()}`,
    name: "",
    command: "",
    category: "attack",
    guardLevels: ["mid"],
    startup: 0,
    active: 0,
    blockAdvantage: 0,
    hitAdvantage: 0,
    damage: 0,
    strength: "weak",
  };
}
