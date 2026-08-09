import { useState } from "react";
import type { Character } from "@/types/character";
import type {
  Move,
  Phase,
  PunishException,
  ResonanceState,
  UsagePhase,
} from "@/types/move";
import { DEFAULT_USAGE_PHASE, PHASES } from "@/lib/moves/moveEnums";
import { getMovesByPhase } from "@/lib/moves/phaseMoves";
import { MOVE_VARIANT_META, PHASE_META } from "@/lib/moves/moveLabels";
import { formatMoveCommand } from "@/lib/moves/command";
import { isChildMove } from "@/lib/moves/grouping";
import { resolveMove } from "@/lib/moves/resolveMove";
import { searchPunishes, type PunishResult } from "@/lib/frame/calcPunish";

export interface MoveOption {
  value: string;
  label: string;
  characterId: string;
  phase: Phase;
}

export interface AttackerContext {
  character: Character;
  phase: Phase;
  /** 選択された技そのもの。技名・コマンドなど状態に依存しない表示に使う。 */
  move: Move;
  /** ジャスト入力トグルを適用した実効値。余裕フレーム表示と確定反撃計算はこちらを使う。 */
  resolvedMove: Move;
  /**
   * 実際に使用したフェイズ（FP/DP登録技ならそのフェイズ、共通技なら選択されたフェイズ）。
   * resolvedMove の解決と防御側候補の解決の両方に使う。
   */
  usagePhase: UsagePhase;
}

/**
 * 技の登録フェイズから使用フェイズを決める。共通技（commonMoves）は FP/DP どちらでも
 * 使われうるため、ユーザーが選んだフェイズ（selectedCommonPhase）をそのまま使う。
 */
const usagePhaseOf = (
  phase: Phase,
  selectedCommonPhase: UsagePhase,
): UsagePhase => (phase === "common" ? selectedCommonPhase : phase);

const buildLabel = (
  characterName: string,
  move: Move,
  parent: Move | undefined,
  phaseShort: string,
): string => {
  const variantTag = isChildMove(move)
    ? `［${MOVE_VARIANT_META[move.variant].label}］`
    : "";
  const command = formatMoveCommand(move, parent?.command);
  return `${characterName} / ${move.name}${variantTag}（${command}）[${phaseShort}]`;
};

const buildMoveOptions = (characters: Character[]): MoveOption[] => {
  const options: MoveOption[] = [];
  for (const character of characters) {
    for (const phase of PHASES) {
      const moves = getMovesByPhase(character, phase);
      const movesById = new Map(moves.map((entry) => [entry.id, entry]));
      for (const move of moves) {
        const parent =
          move.parentMoveId !== undefined
            ? movesById.get(move.parentMoveId)
            : undefined;
        options.push({
          value: move.id,
          label: buildLabel(
            character.name,
            move,
            parent,
            PHASE_META[phase].shortLabel,
          ),
          characterId: character.id,
          phase,
        });
      }
    }
  }
  return options;
};

interface FoundMove {
  character: Character;
  phase: Phase;
  move: Move;
}

const findMoveById = (
  characters: Character[],
  moveId: string,
): FoundMove | undefined => {
  for (const character of characters) {
    for (const phase of PHASES) {
      const moves = getMovesByPhase(character, phase);
      const move = moves.find((entry) => entry.id === moveId);
      if (move !== undefined) {
        return { character, phase, move };
      }
    }
  }
  return undefined;
};

export interface UsePunishSearchParams {
  characters: Character[];
  exceptions: PunishException[];
  fixedDefenderCharacterId?: string;
}

export interface UsePunishSearchResult {
  allMoveOptions: MoveOption[];
  attackerMoveId: string;
  setAttackerMoveId: (id: string) => void;
  attackerJustInput: boolean;
  setAttackerJustInput: (value: boolean) => void;
  /**
   * 攻撃側の技が共通技のとき、使用フェイズとして選ばれている値（デフォルト "duel"）。
   * FP/DP登録技を選んでいるときは無視され、そちらの登録フェイズが使用される。
   */
  attackerCommonPhase: UsagePhase;
  setAttackerCommonPhase: (phase: UsagePhase) => void;
  /** 攻撃側の技が共通技で、フェイズ選択 UI を表示すべきか。 */
  isAttackerPhaseSelectable: boolean;
  defenderCharacterId: string;
  setDefenderCharacterId: (id: string) => void;
  defenderState: ResonanceState;
  setDefenderState: (state: ResonanceState) => void;
  attackerContext: AttackerContext | undefined;
  defender: Character | undefined;
  results: PunishResult[];
  isDefenderFixed: boolean;
}

export const usePunishSearch = ({
  characters,
  exceptions,
  fixedDefenderCharacterId,
}: UsePunishSearchParams): UsePunishSearchResult => {
  // 以下の派生値の再計算抑止は React Compiler の自動メモ化に任せる（手動 useMemo は不要）。
  const allMoveOptions = buildMoveOptions(characters);

  const fixedDefender =
    fixedDefenderCharacterId === undefined
      ? undefined
      : characters.find((c) => c.id === fixedDefenderCharacterId);

  const [attackerMoveId, setAttackerMoveId] = useState<string>(
    allMoveOptions[0]?.value ?? "",
  );
  const [attackerJustInput, setAttackerJustInput] = useState(false);
  const [attackerCommonPhase, setAttackerCommonPhase] =
    useState<UsagePhase>(DEFAULT_USAGE_PHASE);
  const [defenderCharacterId, setDefenderCharacterId] = useState<string>(
    fixedDefenderCharacterId ?? characters[0]?.id ?? "",
  );
  const [defenderState, setDefenderState] = useState<ResonanceState>("normal");

  // ジャスト入力の解決はここだけで行い、表示（余裕フレーム）と計算（searchPunishes）で
  // 同じ実効値を使う。攻撃側の共鳴状態は現状 UI を持たないため通常固定。
  const foundAttackerMove = findMoveById(characters, attackerMoveId);
  const isAttackerPhaseSelectable = foundAttackerMove?.phase === "common";
  const attackerContext: AttackerContext | undefined =
    foundAttackerMove === undefined
      ? undefined
      : (() => {
          const usagePhase = usagePhaseOf(
            foundAttackerMove.phase,
            attackerCommonPhase,
          );
          return {
            ...foundAttackerMove,
            usagePhase,
            resolvedMove: resolveMove(foundAttackerMove.move, {
              resonance: "normal",
              justInput: attackerJustInput,
              phase: usagePhase,
            }),
          };
        })();

  const defender =
    fixedDefender ?? characters.find((c) => c.id === defenderCharacterId);

  const results: PunishResult[] =
    attackerContext === undefined || defender === undefined
      ? []
      : searchPunishes({
          attackerMove: attackerContext.resolvedMove,
          defenderMoves: PHASES.flatMap((phase) =>
            getMovesByPhase(defender, phase),
          ),
          defenderState,
          exceptions,
          phase: attackerContext.usagePhase,
        });

  return {
    allMoveOptions,
    attackerMoveId,
    setAttackerMoveId,
    attackerJustInput,
    setAttackerJustInput,
    attackerCommonPhase,
    setAttackerCommonPhase,
    isAttackerPhaseSelectable,
    defenderCharacterId,
    setDefenderCharacterId,
    defenderState,
    setDefenderState,
    attackerContext,
    defender,
    results,
    isDefenderFixed: fixedDefenderCharacterId !== undefined,
  };
};
