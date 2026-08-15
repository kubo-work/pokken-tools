import type {
  GuardFrameAdvantage,
  Move,
  PunishException,
  ResonanceState,
  UsagePhase,
} from "@/types/move";
import { moveStateOf, resolveMove } from "@/lib/moves/resolveMove";
import {
  bestGuardFrameAdvantage,
  knownWorstGuardFrameAdvantage,
} from "./frameAdvantage";

/** その状態で使用可能な技か。共鳴専用技は通常状態では使えない（ジャスト入力の有無は問わない）。 */
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
  /**
   * ガードされた攻撃側の技。ジャスト入力などの状態は呼び出し側で resolveMove 済みの
   * ものを渡す（解決を1箇所に集約するため、ここでは再解決しない）。
   * 例外ペアの照合は解決後も変わらない move.id で行う。
   */
  attackerMove: Move;
  defenderMoves: Move[];
  defenderState: ResonanceState;
  exceptions: PunishException[];
  /**
   * 防御側の技を解決する際のフェイズ。攻撃側の技が確定しているフェイズ
   * （FP/DP登録技ならそのフェイズ、共通技なら呼び出し側が選ばせたフェイズ）を渡す。
   * 防御側の共通技の fieldPhase 上書きは、このフェイズによってのみ効くかどうかが決まる。
   */
  phase: UsagePhase;
}

/**
 * 防御側の余裕フレーム。max=攻撃側が最も不利な当て方、min=最も有利な当て方のときの値。
 * 単一値の硬直差では max と min が一致する。
 * min は攻撃側の有利側が未計測（bestGuardFrameAdvantage が undefined）なら不明になる。
 * その場合は「有利側でも確定するか」を判定できないため、常に spacingDependent とする。
 */
interface AvailableFrames {
  max: number;
  min: number | undefined;
}

const availableFramesOf = (
  guardFrameAdvantage: GuardFrameAdvantage,
): AvailableFrames => {
  const best = bestGuardFrameAdvantage(guardFrameAdvantage);
  return {
    max: -knownWorstGuardFrameAdvantage(guardFrameAdvantage),
    min: best === undefined ? undefined : -best,
  };
};

/**
 * 攻撃側が最も有利な当て方をしても確定する、と言い切れないなら true。
 * 有利側が未計測（min が undefined）なら判定できないため、同じく true とする。
 */
const isSpacingDependent = (
  availableFrames: AvailableFrames,
  defenderStartup: number,
): boolean =>
  availableFrames.min === undefined ||
  availableFrames.min - defenderStartup < 0;

/** 例外なしの通常判定。最大余裕でも間に合わない技は undefined（確定しない）。 */
const punishResultOf = (
  defenderMove: Move,
  availableFrames: AvailableFrames,
): PunishResult | undefined => {
  const frameAdvantage = availableFrames.max - defenderMove.startup;
  if (frameAdvantage < 0) {
    return undefined;
  }
  return {
    defenderMove,
    frameAdvantage,
    spacingDependent: isSpacingDependent(availableFrames, defenderMove.startup),
  };
};

/**
 * action="hit" の例外を結果にする。フレーム上不成立でも強制的に表示する（先端当て等）。
 * guardFrameAdvantageOverride があればその状況専用の単一値（符号付き）から再計算し、
 * 当て方依存の注記は付けない。
 */
const forcedPunishResultOf = (
  defenderMove: Move,
  availableFrames: AvailableFrames,
  exception: PunishException,
): PunishResult => {
  if (exception.guardFrameAdvantageOverride !== undefined) {
    return {
      defenderMove,
      frameAdvantage:
        -exception.guardFrameAdvantageOverride - defenderMove.startup,
      spacingDependent: false,
      forcedBy: exception,
    };
  }
  const frameAdvantage = availableFrames.max - defenderMove.startup;
  return {
    defenderMove,
    frameAdvantage,
    spacingDependent:
      frameAdvantage >= 0 &&
      isSpacingDependent(availableFrames, defenderMove.startup),
    forcedBy: exception,
  };
};

/**
 * ガードされた攻撃側の技に対する確定反撃を検索する。
 *
 * 余裕フレーム = -攻撃側のガード硬直差（guardFrameAdvantage）。
 *   guardFrameAdvantage は攻撃側視点の符号付き値で、負ほど攻撃側が不利＝防御側の余裕が大きい。
 * frameAdvantage = 余裕フレーム - 防御側の発生。0 以上で成立。
 *
 * ガード硬直差が範囲（当て方・距離で変わる技）の場合:
 *   - 最も不利側（min）の余裕フレームで成立判定し、候補を最大まで表示する。
 *   - 最も有利側（max）では成立しない反撃は spacingDependent=true とする。
 *
 * 例外ペアが登録されている場合は action で上書きする。
 *   - "exclude": フレーム上確定でも結果から除外（ノックバック等）。
 *   - "hit":     フレーム上不可でも強制的に表示（forcedPunishResultOf 参照）。
 */
export const searchPunishes = (params: SearchPunishParams): PunishResult[] => {
  const { attackerMove, defenderMoves, defenderState, exceptions, phase } =
    params;
  const availableFrames = availableFramesOf(attackerMove.guardFrameAdvantage);

  const results: PunishResult[] = [];
  for (const candidate of defenderMoves) {
    if (
      !isDefenderCandidate(candidate) ||
      !isMoveAvailable(candidate, defenderState)
    ) {
      continue;
    }
    // 反撃側はジャスト入力を考慮しない。攻撃側の技がジャスト入力だったかだけを問う。
    const defenderMove = resolveMove(candidate, moveStateOf(defenderState, phase));
    const exception = exceptions.find(
      (entry) =>
        entry.attackerMoveId === attackerMove.id &&
        entry.defenderMoveId === candidate.id,
    );
    const result =
      exception === undefined
        ? punishResultOf(defenderMove, availableFrames)
        : exception.action === "exclude"
          ? undefined
          : forcedPunishResultOf(defenderMove, availableFrames, exception);
    if (result !== undefined) {
      results.push(result);
    }
  }

  results.sort((a, b) => b.frameAdvantage - a.frameAdvantage);
  return results;
};
