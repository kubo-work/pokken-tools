import { describe, expect, test } from "bun:test";
import {
  moveStateOf,
  resolveJustInputMove,
  resolveMove,
} from "@/lib/moves/resolveMove";
import type { Move } from "@/types/move";
import { makeMove } from "./testFixtures";

describe("resolveMove: 共鳴のみ", () => {
  test("通常状態では技をそのまま返す", () => {
    const move = makeMove({ id: "move", resonance: { startup: 5 } });
    expect(resolveMove(move, moveStateOf("normal", "duel"))).toBe(move);
  });

  test("共鳴状態でも resonance 差分が無ければそのまま返す", () => {
    const move = makeMove({ id: "move" });
    expect(resolveMove(move, moveStateOf("resonance", "duel"))).toBe(move);
  });

  test("共鳴状態では resonance 差分で上書きし、元の技は変更しない", () => {
    const move = makeMove({
      id: "move",
      startup: 12,
      guardFrameAdvantage: -6,
      resonance: { startup: 8, guardFrameAdvantage: -2 },
    });
    const resolved = resolveMove(move, moveStateOf("resonance", "duel"));
    expect(resolved.startup).toBe(8);
    expect(resolved.guardFrameAdvantage).toBe(-2);
    expect(resolved.name).toBe(move.name);
    expect(move.startup).toBe(12);
    expect(move.guardFrameAdvantage).toBe(-6);
  });
});

describe("resolveMove: ジャスト入力のみ", () => {
  test("justInput が無ければジャスト入力を ON にしても変わらない", () => {
    const move = makeMove({ id: "move" });
    expect(
      resolveMove(move, { resonance: "normal", justInput: true, phase: "duel" }),
    ).toBe(move);
  });

  test("ジャスト入力 OFF では justInput 差分は適用されない", () => {
    const move = makeMove({ id: "move", startup: 10, justInput: { startup: 6 } });
    const resolved = resolveMove(move, {
      resonance: "normal",
      justInput: false,
      phase: "duel",
    });
    expect(resolved.startup).toBe(10);
  });

  test("ジャスト入力 ON では justInput 差分で上書きする", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      baseDamage: 20,
      justInput: { startup: 6, baseDamage: 30 },
    });
    const resolved = resolveMove(move, {
      resonance: "normal",
      justInput: true,
      phase: "duel",
    });
    expect(resolved.startup).toBe(6);
    expect(resolved.baseDamage).toBe(30);
  });
});

describe("resolveMove: 共鳴×ジャスト入力の組み合わせ", () => {
  test("共鳴のみ ON なら通常の resonance 差分が適用される", () => {
    const move = makeMove({
      id: "move",
      baseDamage: 20,
      resonance: { baseDamage: 25 },
      justInput: { baseDamage: 30, resonance: { baseDamage: 35 } },
    });
    const resolved = resolveMove(move, {
      resonance: "resonance",
      justInput: false,
      phase: "duel",
    });
    expect(resolved.baseDamage).toBe(25);
  });

  test("ジャスト入力のみ ON なら justInput の値が適用される（共鳴の値は無視）", () => {
    const move = makeMove({
      id: "move",
      baseDamage: 20,
      resonance: { baseDamage: 25 },
      justInput: { baseDamage: 30, resonance: { baseDamage: 35 } },
    });
    const resolved = resolveMove(move, {
      resonance: "normal",
      justInput: true,
      phase: "duel",
    });
    expect(resolved.baseDamage).toBe(30);
  });

  test("共鳴×ジャスト入力の両方 ON では justInput.resonance が最終値になる（共鳴でさらに伸びる）", () => {
    const move = makeMove({
      id: "move",
      baseDamage: 20,
      resonance: { baseDamage: 25 },
      justInput: { baseDamage: 30, resonance: { baseDamage: 35 } },
    });
    const resolved = resolveMove(move, {
      resonance: "resonance",
      justInput: true,
      phase: "duel",
    });
    expect(resolved.baseDamage).toBe(35);
  });

  test("justInput.resonance が未定義のフィールドは justInput の値にフォールバックする", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      baseDamage: 20,
      // justInput.resonance は baseDamage しか定義していない
      justInput: { startup: 6, baseDamage: 30, resonance: { baseDamage: 35 } },
    });
    const resolved = resolveMove(move, {
      resonance: "resonance",
      justInput: true,
      phase: "duel",
    });
    expect(resolved.startup).toBe(6);
    expect(resolved.baseDamage).toBe(35);
  });

  test("justInput.resonance 自体が未定義なら、共鳴×ジャストでも通常のジャスト値のまま", () => {
    const move = makeMove({
      id: "move",
      baseDamage: 20,
      resonance: { baseDamage: 25 },
      justInput: { baseDamage: 30 },
    });
    const resolved = resolveMove(move, {
      resonance: "resonance",
      justInput: true,
      phase: "duel",
    });
    expect(resolved.baseDamage).toBe(30);
  });
});

describe("resolveJustInputMove", () => {
  test("justInput が無ければ undefined", () => {
    const move = makeMove({ id: "move" });
    expect(resolveJustInputMove(move, "duel")).toBeUndefined();
  });

  test("justInput の差分をベース値に適用した Move を返す", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      guardFrameAdvantage: -5,
      justInput: { startup: 6, acceptFrames: { start: 4, end: 6 } },
    });
    const resolved = resolveJustInputMove(move, "duel");
    expect(resolved?.startup).toBe(6);
    expect(resolved?.guardFrameAdvantage).toBe(-5);
    expect(resolved?.id).toBe(move.id);
  });

  test("resonance には justInput.resonance を詰め替える（共鳴中はジャストがさらに変わる技向け）", () => {
    const move = makeMove({
      id: "move",
      resonance: { startup: 8 },
      justInput: { startup: 6, resonance: { startup: 4 } },
    });
    const resolved = resolveJustInputMove(move, "duel");
    expect(resolved?.resonance).toEqual({ startup: 4 });
  });

  test("justInput が触っていないフィールドの共鳴差分は引き継ぐ", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      baseDamage: 20,
      resonance: { startup: 8 },
      justInput: { baseDamage: 30, resonance: { baseDamage: 35 } },
    });
    const resolved = resolveJustInputMove(move, "duel");
    // 発生はジャスト入力では変わらないので、共鳴の 8 がそのまま効く。
    expect(resolved?.resonance).toEqual({ startup: 8, baseDamage: 35 });
  });

  test("justInput が上書き済みのフィールドは、共鳴差分に打ち消されて残らない", () => {
    // 共鳴で発生 8 になる技だが、ジャスト入力なら共鳴の有無に関わらず 6。
    const move = makeMove({
      id: "move",
      startup: 10,
      resonance: { startup: 8 },
      justInput: { startup: 6 },
    });
    const resolved = resolveJustInputMove(move, "duel");
    expect(resolved?.startup).toBe(6);
    expect(resolved?.resonance).toBeUndefined();
  });
});

describe("resolveJustInputMove と resolveMove の整合性", () => {
  /** ジャスト列の表示値（base と共鳴上書き）が、計算用の resolveMove と一致することを確かめる。 */
  const expectConsistentWithResolveMove = (move: Move) => {
    const justColumn = resolveJustInputMove(move, "duel");
    const normalState = resolveMove(move, {
      resonance: "normal",
      justInput: true,
      phase: "duel",
    });
    const resonanceState = resolveMove(move, {
      resonance: "resonance",
      justInput: true,
      phase: "duel",
    });
    expect(justColumn?.startup).toBe(normalState.startup);
    expect(justColumn?.baseDamage).toBe(normalState.baseDamage);
    // 詳細ページは「base の値 →resonance の値」で描くため、上書きを当てた結果が実効値になる。
    expect(justColumn?.resonance?.startup ?? justColumn?.startup).toBe(
      resonanceState.startup,
    );
    expect(justColumn?.resonance?.baseDamage ?? justColumn?.baseDamage).toBe(
      resonanceState.baseDamage,
    );
  };

  test("共鳴とジャストが別のフィールドを変える技", () => {
    expectConsistentWithResolveMove(
      makeMove({
        id: "move",
        startup: 10,
        baseDamage: 20,
        resonance: { startup: 8 },
        justInput: { baseDamage: 30, resonance: { baseDamage: 35 } },
      }),
    );
  });

  test("共鳴とジャストが同じフィールドを変える技", () => {
    expectConsistentWithResolveMove(
      makeMove({
        id: "move",
        startup: 10,
        resonance: { startup: 8 },
        justInput: { startup: 6 },
      }),
    );
  });

  test("共鳴中のジャストだけさらに変わる技", () => {
    expectConsistentWithResolveMove(
      makeMove({
        id: "move",
        startup: 10,
        baseDamage: 20,
        resonance: { startup: 8, baseDamage: 25 },
        justInput: { startup: 6, resonance: { startup: 4, baseDamage: 35 } },
      }),
    );
  });
});
