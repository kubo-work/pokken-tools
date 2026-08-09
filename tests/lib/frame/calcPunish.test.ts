import { describe, expect, test } from "bun:test";
import { isMoveAvailable, searchPunishes } from "@/lib/frame/calcPunish";
import { resolveMove } from "@/lib/moves/resolveMove";
import type { Move, PunishException } from "@/types/move";

/** テスト用の最小の有効な技。上書きしたい項目だけ指定する。 */
const makeMove = (overrides: Partial<Move> & { id: string }): Move => ({
  name: overrides.id,
  command: "Y",
  category: "attack",
  attackType: "strike",
  guardLevel: "mid",
  startup: 10,
  guardFrameAdvantage: -5,
  strength: 1,
  ...overrides,
});

describe("isMoveAvailable", () => {
  test("共鳴専用技は通常状態では使えない", () => {
    const move = makeMove({ id: "move", resonanceOnly: true });
    expect(isMoveAvailable(move, "normal")).toBe(false);
  });

  test("共鳴専用技は共鳴状態では使える", () => {
    const move = makeMove({ id: "move", resonanceOnly: true });
    expect(isMoveAvailable(move, "resonance")).toBe(true);
  });

  test("共鳴専用でない技はどちらの状態でも使える", () => {
    const move = makeMove({ id: "move" });
    expect(isMoveAvailable(move, "normal")).toBe(true);
    expect(isMoveAvailable(move, "resonance")).toBe(true);
  });
});

describe("searchPunishes: 基本判定", () => {
  const attacker = makeMove({ id: "attacker", guardFrameAdvantage: -10 });

  test("余裕フレーム >= 発生の技だけが確定反撃になる（境界の 0 は成立）", () => {
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [
        makeMove({ id: "startup_10", startup: 10 }),
        makeMove({ id: "startup_11", startup: 11 }),
      ],
      defenderState: "normal",
      exceptions: [],
    });
    expect(results.map((result) => result.defenderMove.id)).toEqual([
      "startup_10",
    ]);
    expect(results[0]!.frameAdvantage).toBe(0);
    expect(results[0]!.spacingDependent).toBe(false);
    expect(results[0]!.forcedBy).toBeUndefined();
  });

  test("結果は防御側の有利フレームの降順に並ぶ", () => {
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [
        makeMove({ id: "startup_8", startup: 8 }),
        makeMove({ id: "startup_4", startup: 4 }),
        makeMove({ id: "startup_10", startup: 10 }),
      ],
      defenderState: "normal",
      exceptions: [],
    });
    expect(results.map((result) => result.defenderMove.id)).toEqual([
      "startup_4",
      "startup_8",
      "startup_10",
    ]);
    expect(results.map((result) => result.frameAdvantage)).toEqual([6, 2, 0]);
  });

  test("攻撃側が有利（正の硬直差）なら何も確定しない", () => {
    const plusOnGuard = makeMove({ id: "plus", guardFrameAdvantage: 2 });
    const results = searchPunishes({
      phase: "duel",
      attackerMove: plusOnGuard,
      defenderMoves: [makeMove({ id: "fastest", startup: 1 })],
      defenderState: "normal",
      exceptions: [],
    });
    expect(results).toEqual([]);
  });
});

describe("searchPunishes: ガード硬直差が範囲の技", () => {
  const attacker = makeMove({
    id: "attacker",
    guardFrameAdvantage: { min: -8, max: -4 },
  });

  test("不利側でのみ確定する反撃は spacingDependent が付く", () => {
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [makeMove({ id: "startup_6", startup: 6 })],
      defenderState: "normal",
      exceptions: [],
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.frameAdvantage).toBe(2);
    expect(results[0]!.spacingDependent).toBe(true);
  });

  test("有利側の当て方でも確定する反撃には spacingDependent が付かない", () => {
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [makeMove({ id: "startup_4", startup: 4 })],
      defenderState: "normal",
      exceptions: [],
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.frameAdvantage).toBe(4);
    expect(results[0]!.spacingDependent).toBe(false);
  });

  test("最も不利側の当て方でも間に合わない技は含まれない", () => {
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [makeMove({ id: "startup_9", startup: 9 })],
      defenderState: "normal",
      exceptions: [],
    });
    expect(results).toEqual([]);
  });
});

describe("searchPunishes: 防御側候補の絞り込み", () => {
  const attacker = makeMove({ id: "attacker", guardFrameAdvantage: -20 });

  test("ため・派生技は反撃候補から除外される", () => {
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [
        makeMove({ id: "parent", startup: 8 }),
        makeMove({
          id: "charge_child",
          startup: 8,
          variant: "charge",
          parentMoveId: "parent",
        }),
        makeMove({
          id: "derivative_child",
          startup: 8,
          variant: "derivative",
          parentMoveId: "parent",
        }),
      ],
      defenderState: "normal",
      exceptions: [],
    });
    expect(results.map((result) => result.defenderMove.id)).toEqual(["parent"]);
  });

  test("variant が明示的に normal の技は候補に含まれる", () => {
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [makeMove({ id: "normal", startup: 8, variant: "normal" })],
      defenderState: "normal",
      exceptions: [],
    });
    expect(results.map((result) => result.defenderMove.id)).toEqual(["normal"]);
  });
});

describe("searchPunishes: 共鳴状態", () => {
  const attacker = makeMove({ id: "attacker", guardFrameAdvantage: -10 });

  test("共鳴専用技は通常状態の検索には出ず、共鳴状態では出る", () => {
    const defenderMoves = [
      makeMove({ id: "resonance_only", startup: 6, resonanceOnly: true }),
    ];
    const normalResults = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves,
      defenderState: "normal",
      exceptions: [],
    });
    expect(normalResults).toEqual([]);

    const resonanceResults = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves,
      defenderState: "resonance",
      exceptions: [],
    });
    expect(
      resonanceResults.map((result) => result.defenderMove.id),
    ).toEqual(["resonance_only"]);
  });

  test("共鳴状態では resonance 差分の発生で判定される", () => {
    // 通常時は発生 12 で間に合わないが、共鳴中は発生 8 で確定する技
    const defenderMoves = [
      makeMove({ id: "faster_in_resonance", startup: 12, resonance: { startup: 8 } }),
    ];
    const normalResults = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves,
      defenderState: "normal",
      exceptions: [],
    });
    expect(normalResults).toEqual([]);

    const resonanceResults = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves,
      defenderState: "resonance",
      exceptions: [],
    });
    expect(resonanceResults).toHaveLength(1);
    expect(resonanceResults[0]!.frameAdvantage).toBe(2);
  });
});

describe("searchPunishes: 攻撃側のジャスト入力", () => {
  // 攻撃側の状態解決は呼び出し側（usePunishSearch）の責務なので、ここには解決済みの技を渡す。
  const justInputState = {
    resonance: "normal",
    justInput: true,
    phase: "duel",
  } as const;

  test("解決済みのジャスト入力版を渡すと、その硬直差で余裕フレームが決まる", () => {
    // 通常は -10（余裕10）だが、ジャスト入力だと -6（余裕6）に変わる技
    const attacker = makeMove({
      id: "attacker",
      guardFrameAdvantage: -10,
      justInput: { guardFrameAdvantage: -6 },
    });
    const defenderMoves = [makeMove({ id: "startup_8", startup: 8 })];

    const normalResults = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves,
      defenderState: "normal",
      exceptions: [],
    });
    expect(normalResults).toHaveLength(1);
    expect(normalResults[0]!.frameAdvantage).toBe(2);

    const justInputResults = searchPunishes({
      phase: "duel",
      attackerMove: resolveMove(attacker, justInputState),
      defenderMoves,
      defenderState: "normal",
      exceptions: [],
    });
    expect(justInputResults).toEqual([]);
  });

  test("解決済みの技を渡しても例外ペアは元の技 ID で照合される", () => {
    const attacker = makeMove({
      id: "attacker",
      guardFrameAdvantage: -10,
      justInput: { guardFrameAdvantage: -6 },
    });
    const exception: PunishException = {
      attackerMoveId: "attacker",
      defenderMoveId: "defender",
      action: "exclude",
    };
    const results = searchPunishes({
      phase: "duel",
      attackerMove: resolveMove(attacker, justInputState),
      defenderMoves: [makeMove({ id: "defender", startup: 4 })],
      defenderState: "normal",
      exceptions: [exception],
    });
    expect(results).toEqual([]);
  });

  test("反撃側は justInput 差分を考慮しない（反撃はジャスト入力しない前提）", () => {
    const attacker = makeMove({ id: "attacker", guardFrameAdvantage: -10 });
    // 通常発生12で間に合わないが、ジャスト入力なら発生8になる反撃技
    const defenderMoves = [
      makeMove({ id: "defender", startup: 12, justInput: { startup: 8 } }),
    ];
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves,
      defenderState: "normal",
      exceptions: [],
    });
    expect(results).toEqual([]);
  });
});

describe("searchPunishes: 例外ペア", () => {
  const attacker = makeMove({ id: "attacker", guardFrameAdvantage: -10 });

  test("exclude はフレーム上確定でも結果から除外する", () => {
    const exceptions: PunishException[] = [
      { attackerMoveId: "attacker", defenderMoveId: "excluded", action: "exclude" },
    ];
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [
        makeMove({ id: "excluded", startup: 6 }),
        makeMove({ id: "kept", startup: 6 }),
      ],
      defenderState: "normal",
      exceptions,
    });
    expect(results.map((result) => result.defenderMove.id)).toEqual(["kept"]);
  });

  test("hit はフレーム上不成立でも強制的に含めて forcedBy を付ける", () => {
    const exception: PunishException = {
      attackerMoveId: "attacker",
      defenderMoveId: "forced",
      action: "hit",
    };
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [makeMove({ id: "forced", startup: 15 })],
      defenderState: "normal",
      exceptions: [exception],
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.frameAdvantage).toBe(-5);
    expect(results[0]!.spacingDependent).toBe(false);
    expect(results[0]!.forcedBy).toBe(exception);
  });

  test("hit + 範囲硬直差では不利側でのみ成立する場合に spacingDependent が付く", () => {
    const exception: PunishException = {
      attackerMoveId: "range_attacker",
      defenderMoveId: "forced",
      action: "hit",
    };
    const rangeAttacker = makeMove({
      id: "range_attacker",
      guardFrameAdvantage: { min: -8, max: -4 },
    });
    const results = searchPunishes({
      phase: "duel",
      attackerMove: rangeAttacker,
      defenderMoves: [makeMove({ id: "forced", startup: 6 })],
      defenderState: "normal",
      exceptions: [exception],
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.frameAdvantage).toBe(2);
    expect(results[0]!.spacingDependent).toBe(true);
    expect(results[0]!.forcedBy).toBe(exception);
  });

  test("hit + guardFrameAdvantageOverride は上書き値から再計算し spacingDependent を付けない", () => {
    const exception: PunishException = {
      attackerMoveId: "range_attacker",
      defenderMoveId: "forced",
      action: "hit",
      guardFrameAdvantageOverride: -12,
    };
    const rangeAttacker = makeMove({
      id: "range_attacker",
      guardFrameAdvantage: { min: -8, max: -4 },
    });
    const results = searchPunishes({
      phase: "duel",
      attackerMove: rangeAttacker,
      defenderMoves: [makeMove({ id: "forced", startup: 6 })],
      defenderState: "normal",
      exceptions: [exception],
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.frameAdvantage).toBe(6);
    expect(results[0]!.spacingDependent).toBe(false);
    expect(results[0]!.forcedBy).toBe(exception);
  });

  test("別の攻撃技向けの例外は適用されない", () => {
    const exceptions: PunishException[] = [
      {
        attackerMoveId: "other_attacker",
        defenderMoveId: "defender",
        action: "exclude",
      },
    ];
    const results = searchPunishes({
      phase: "duel",
      attackerMove: attacker,
      defenderMoves: [makeMove({ id: "defender", startup: 6 })],
      defenderState: "normal",
      exceptions,
    });
    expect(results.map((result) => result.defenderMove.id)).toEqual([
      "defender",
    ]);
    expect(results[0]!.forcedBy).toBeUndefined();
  });
});
