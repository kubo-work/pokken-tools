import type { Move, PunishException, ResonanceState } from "@/types/move";

/**
 * 共鳴状態を解決し、その状態での実効フレーム値を持つ技を返す。
 * resonance 差分があり state が "resonance" のときだけ上書きを適用する。
 */
export function resolveMove(move: Move, state: ResonanceState): Move {
  if (state === "normal" || move.resonance === undefined) {
    return move;
  }
  return { ...move, ...move.resonance };
}

/** その状態で使用可能な技か。共鳴専用技は通常状態では使えない。 */
export function isMoveAvailable(move: Move, state: ResonanceState): boolean {
  if (move.resonanceOnly === true && state === "normal") {
    return false;
  }
  return true;
}

export interface PunishResult {
  defenderMove: Move;
  /** 余裕フレーム - 防御側発生。0 以上で確定反撃が成立。 */
  frameAdvantage: number;
  forcedBy?: PunishException;
}

export interface SearchPunishParams {
  attackerMove: Move;
  defenderMoves: Move[];
  defenderState: ResonanceState;
  exceptions: PunishException[];
}

/**
 * ガードされた攻撃側の技に対する確定反撃を検索する。
 *
 * 余裕フレーム = -(攻撃側 blockAdvantage)。
 * frameAdvantage = 余裕フレーム - 防御側の発生。0 以上で成立。
 *
 * 例外ペアが登録されている場合は action で上書きする。
 *   - "exclude": フレーム上確定でも結果から除外（ノックバック等）。
 *   - "hit":     フレーム上不可でも強制的に表示（先端当て等）。
 */
export function searchPunishes(params: SearchPunishParams): PunishResult[] {
  const { attackerMove, defenderMoves, defenderState, exceptions } = params;
  const availableFrames = -attackerMove.blockAdvantage;

  const results: PunishResult[] = [];
  for (const candidate of defenderMoves) {
    if (!isMoveAvailable(candidate, defenderState)) {
      continue;
    }

    const defenderMove = resolveMove(candidate, defenderState);
    const frameAdvantage = availableFrames - defenderMove.startup;
    const exception = exceptions.find(
      (entry) =>
        entry.attackerMoveId === attackerMove.id && entry.defenderMoveId === candidate.id,
    );

    if (exception !== undefined) {
      if (exception.action === "exclude") {
        continue;
      }
      results.push({ defenderMove, frameAdvantage, forcedBy: exception });
      continue;
    }

    if (frameAdvantage >= 0) {
      results.push({ defenderMove, frameAdvantage });
    }
  }

  results.sort((a, b) => b.frameAdvantage - a.frameAdvantage);
  return results;
}
