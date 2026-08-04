import type { Character } from "@/types/character";
import type { PunishException, ResonanceState } from "@/types/move";
import { FrameNumber } from "@/components/FrameNumber";
import { CategoryBadge } from "@/components/badges";
import { usePunishSearch } from "@/hooks/punish/usePunishSearch";
import { formatPunishWindow } from "@/lib/frame/frameAdvantage";
import { moveGuardLevelShortLabel } from "@/lib/moves/moveCategoricalDisplay";

/** 範囲登録された硬直差の不利側でのみ確定する反撃に付ける注記。 */
const SPACING_DEPENDENT_NOTE = "当て方・距離次第で確定しない場合あり";

const RESONANCE_OPTIONS: { value: ResonanceState; label: string }[] = [
  { value: "normal", label: "通常" },
  { value: "resonance", label: "共鳴" },
];

export interface PunishSearchProps {
  characters: Character[];
  exceptions: PunishException[];
  /** キャラ別検索時、防御側を固定するためのID。グローバル検索では undefined。 */
  fixedDefenderCharacterId?: string;
}

export const PunishSearch = ({
  characters,
  exceptions,
  fixedDefenderCharacterId,
}: PunishSearchProps) => {
  const {
    allMoveOptions,
    attackerMoveId,
    setAttackerMoveId,
    attackerJustInput,
    setAttackerJustInput,
    defenderCharacterId,
    setDefenderCharacterId,
    defenderState,
    setDefenderState,
    attackerContext,
    results,
    isDefenderFixed,
  } = usePunishSearch({
    characters,
    exceptions,
    fixedDefenderCharacterId,
  });

  return (
    <>
      <div className="punish-form">
        <div className="punish-form__row">
          <label htmlFor="attackerMove">ガードした攻撃側の技</label>
          <select
            id="attackerMove"
            value={attackerMoveId}
            onChange={(event) => setAttackerMoveId(event.target.value)}
          >
            {allMoveOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="punish-form__row">
          <span>攻撃側の入力</span>
          <label className="punish-form__checkbox" htmlFor="attackerJustInput">
            <input
              type="checkbox"
              id="attackerJustInput"
              checked={attackerJustInput}
              onChange={(event) =>
                setAttackerJustInput(event.target.checked)
              }
            />
            ジャスト入力で当てた
          </label>
        </div>
        {!isDefenderFixed && (
          <div className="punish-form__row">
            <label htmlFor="defenderCharacter">反撃する防御側のキャラ</label>
            <select
              id="defenderCharacter"
              value={defenderCharacterId}
              onChange={(event) => setDefenderCharacterId(event.target.value)}
            >
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="punish-form__row">
          <label htmlFor="defenderState">防御側の共鳴状態</label>
          <select
            id="defenderState"
            value={defenderState}
            onChange={(event) =>
              setDefenderState(event.target.value as ResonanceState)
            }
          >
            {RESONANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {attackerContext === undefined ? (
        <div className="empty">攻撃側の技を選択してください。</div>
      ) : (
        <>
          <p className="page-lead" style={{ marginBottom: 12 }}>
            余裕フレーム:{" "}
            {formatPunishWindow(
              attackerContext.resolvedMove.guardFrameAdvantage,
            )}
            F（攻撃側 {attackerContext.character.name} /{" "}
            {attackerContext.move.name} がガードされた前提）
          </p>
          {results.length === 0 ? (
            <div className="empty">確定反撃はありません。</div>
          ) : (
            <table className="moves-table">
              <thead>
                <tr>
                  <th>余裕F</th>
                  <th>反撃技</th>
                  <th>コマンド</th>
                  <th>判定</th>
                  <th className="num">発生</th>
                  <th>備考</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.defenderMove.id}>
                    <td>
                      <FrameNumber value={result.frameAdvantage} />
                    </td>
                    <td>
                      <CategoryBadge category={result.defenderMove.category} />{" "}
                      {result.defenderMove.name}
                    </td>
                    <td>{result.defenderMove.command}</td>
                    <td>{moveGuardLevelShortLabel(result.defenderMove)}</td>
                    <td className="num">{result.defenderMove.startup}</td>
                    <td style={{ fontSize: 12, color: "#9095a0" }}>
                      {[
                        result.spacingDependent
                          ? SPACING_DEPENDENT_NOTE
                          : undefined,
                        result.forcedBy?.note,
                      ]
                        .filter((note) => note !== undefined)
                        .join(" / ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
};
