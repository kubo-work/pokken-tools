"use client";

import { useMemo, useState } from "react";
import type { Character } from "@/types/character";
import type { Move, Phase, PunishException, ResonanceState } from "@/types/move";
import { PHASE_META } from "@/lib/meta";
import { searchPunishes } from "@/lib/frame/calcPunish";
import { FrameNumber } from "@/components/FrameNumber";
import { CategoryBadge, GuardBadges } from "@/components/badges";

const PHASES: Phase[] = ["duel", "field"];
const RESONANCE_OPTIONS: { value: ResonanceState; label: string }[] = [
  { value: "normal", label: "通常" },
  { value: "resonance", label: "共鳴" },
];

interface MoveOption {
  value: string;
  label: string;
  characterId: string;
  phase: Phase;
}

function buildMoveOptions(characters: Character[]): MoveOption[] {
  const options: MoveOption[] = [];
  for (const character of characters) {
    for (const phase of PHASES) {
      const moves = phase === "field" ? character.fieldMoves : character.duelMoves;
      for (const move of moves) {
        options.push({
          value: move.id,
          label: `${character.name} / ${move.name}（${move.command}）[${PHASE_META[phase].shortLabel}]`,
          characterId: character.id,
          phase,
        });
      }
    }
  }
  return options;
}

function findMoveById(
  characters: Character[],
  moveId: string,
): { character: Character; phase: Phase; move: Move } | undefined {
  for (const character of characters) {
    for (const phase of PHASES) {
      const moves = phase === "field" ? character.fieldMoves : character.duelMoves;
      const move = moves.find((entry) => entry.id === moveId);
      if (move !== undefined) {
        return { character, phase, move };
      }
    }
  }
  return undefined;
}

export interface PunishSearchProps {
  characters: Character[];
  exceptions: PunishException[];
  /** キャラ別検索時、防御側を固定するためのID。グローバル検索では undefined。 */
  fixedDefenderCharacterId?: string;
}

export function PunishSearch({
  characters,
  exceptions,
  fixedDefenderCharacterId,
}: PunishSearchProps) {
  const allMoveOptions = useMemo(() => buildMoveOptions(characters), [characters]);

  const defenderCharacter = useMemo(
    () =>
      fixedDefenderCharacterId === undefined
        ? undefined
        : characters.find((c) => c.id === fixedDefenderCharacterId),
    [characters, fixedDefenderCharacterId],
  );

  const [attackerMoveId, setAttackerMoveId] = useState<string>(
    allMoveOptions[0]?.value ?? "",
  );
  const [defenderCharacterId, setDefenderCharacterId] = useState<string>(
    fixedDefenderCharacterId ?? characters[0]?.id ?? "",
  );
  const [defenderState, setDefenderState] = useState<ResonanceState>("normal");

  const attackerCtx = findMoveById(characters, attackerMoveId);
  const defender = defenderCharacter ?? characters.find((c) => c.id === defenderCharacterId);

  const results = useMemo(() => {
    if (attackerCtx === undefined || defender === undefined) {
      return [];
    }
    return searchPunishes({
      attackerMove: attackerCtx.move,
      defenderMoves: [...defender.duelMoves, ...defender.fieldMoves],
      defenderState,
      exceptions,
    });
  }, [attackerCtx, defender, defenderState, exceptions]);

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
        {fixedDefenderCharacterId === undefined && (
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

      {attackerCtx === undefined ? (
        <div className="empty">攻撃側の技を選択してください。</div>
      ) : (
        <>
          <p className="page-lead" style={{ marginBottom: 12 }}>
            余裕フレーム: <FrameNumber value={-attackerCtx.move.blockAdvantage} />（攻撃側
            {" "}
            {attackerCtx.character.name} / {attackerCtx.move.name} がガードされた前提）
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
                  <th>ガード</th>
                  <th className="num">発生</th>
                  <th className="num">威力</th>
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
                    <td>
                      <GuardBadges levels={result.defenderMove.guardLevels} />
                    </td>
                    <td className="num">{result.defenderMove.startup}</td>
                    <td className="num">{result.defenderMove.damage}</td>
                    <td style={{ fontSize: 12, color: "#9095a0" }}>
                      {result.forcedBy?.note ?? ""}
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
}
