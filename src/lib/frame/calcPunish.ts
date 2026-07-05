import type { Move, PunishException, ResonanceState } from "@/types/move";
import {
  bestGuardFrameAdvantage,
  worstGuardFrameAdvantage,
} from "./frameAdvantage";

/**
 * 共鳴状態を解決し、その状態での実効フレーム値を持つ技を返す。
 * resonance 差分があり state が "resonance" のときだけ上書きを適用する。
 */
export const resolveMove = (move: Move, state: ResonanceState): Move => {
  if (state === "normal" || move.resonance === undefined) {
    return move;
  }
  return { ...move, ...move.resonance };
};

/** その状態で使用可能な技か。共鳴専用技は通常状態では使えない。 */
export const isMoveAvailable = (move: Move, state: ResonanceState): boolean =>
  !(move.resonanceOnly === true && state === "normal");

/**
 * ため・派生は反撃時に咄嗟に出せない想定なので防御側候補から除外する。
 * variant 未設定は通常技扱い。
 */
const isDefenderCandidate = (move: Move): boolean =>
  move.variant === undefined || move.variant === "normal";

export interface PunishResult {
  defenderMove: Move;
  /**
   * 防御側の余裕フレーム - 防御側発生。0 以上で確定反撃が成立。
   * 攻撃側のガード硬直差が範囲の場合は最も不利側（余裕が最大のケース）で計算した値。
   */
  frameAdvantage: number;
  /**
   * 攻撃側のガード硬直差が範囲登録されていて、不利側の当て方でのみ確定する反撃なら true。
   * UI では「当て方・距離次第で確定しない場合あり」の注記を付ける。
   */
  spacingDependent: boolean;
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
 * 余裕フレーム = -攻撃側のガード硬直差（guardFrameAdvantage）。
 *   guardFrameAdvantage は攻撃側視点の符号付き値で、負ほど攻撃側が不利＝防御側の余裕が大きい。
 * frameAdvantage = 余裕フレーム - 防御側の発生。0 以上で成立。
 *
 * ガード硬直差が範囲（当て方・距離で変わる技）の場合:
 *   - 最も不利側（min）の余裕フレームで成立判定し、候補を最大まで表示する。
 *   - 最も有利側（max）では成立しない反撃は spacingDependent=true とし、
 *     「当て方次第で確定しない場合あり」を UI で注記する。
 *
 * 例外ペアが登録されている場合は action で上書きする。
 *   - "exclude": フレーム上確定でも結果から除外（ノックバック等）。
 *   - "hit":     フレーム上不可でも強制的に表示（先端当て等）。
 *                guardFrameAdvantageOverride が指定されていればそれ（符号付き・単一値）から
 *                余裕フレームを再計算する。
 */
export const searchPunishes = (params: SearchPunishParams): PunishResult[] => {
  const { attackerMove, defenderMoves, defenderState, exceptions } = params;
  // 最大余裕 = 攻撃側が最も不利な当て方。単一値の技は最大・最小が一致する。
  const maxAvailableFrames = -worstGuardFrameAdvantage(
    attackerMove.guardFrameAdvantage,
  );
  const minAvailableFrames = -bestGuardFrameAdvantage(
    attackerMove.guardFrameAdvantage,
  );

  const results: PunishResult[] = [];
  for (const candidate of defenderMoves) {
    if (!isDefenderCandidate(candidate)) {
      continue;
    }
    if (!isMoveAvailable(candidate, defenderState)) {
      continue;
    }

    const defenderMove = resolveMove(candidate, defenderState);
    const exception = exceptions.find(
      (entry) =>
        entry.attackerMoveId === attackerMove.id &&
        entry.defenderMoveId === candidate.id,
    );

    if (exception !== undefined) {
      if (exception.action === "exclude") {
        continue;
      }
      const overrideAdvantage = exception.guardFrameAdvantageOverride;
      const availableFrames =
        overrideAdvantage !== undefined
          ? -overrideAdvantage
          : maxAvailableFrames;
      results.push({
        defenderMove,
        frameAdvantage: availableFrames - defenderMove.startup,
        // 上書き値があるときはその状況専用の単一値なので当て方依存の注記は不要。
        spacingDependent:
          overrideAdvantage === undefined &&
          maxAvailableFrames - defenderMove.startup >= 0 &&
          minAvailableFrames - defenderMove.startup < 0,
        forcedBy: exception,
      });
      continue;
    }

    const frameAdvantage = maxAvailableFrames - defenderMove.startup;
    if (frameAdvantage >= 0) {
      results.push({
        defenderMove,
        frameAdvantage,
        spacingDependent: minAvailableFrames - defenderMove.startup < 0,
      });
    }
  }

  results.sort((a, b) => b.frameAdvantage - a.frameAdvantage);
  return results;
};
