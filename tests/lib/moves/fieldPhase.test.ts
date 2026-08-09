import { describe, expect, test } from "bun:test";
import {
  moveColumnKey,
  moveStateOf,
  resolveFieldPhaseMove,
  resolveJustInputMove,
  resolveMove,
} from "@/lib/moves/resolveMove";
import { makeMove } from "./testFixtures";

describe("resolveMove: フィールドフェイズの上書き", () => {
  test("phase='duel' では fieldPhase 差分は適用されない", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      fieldPhase: { startup: 6 },
    });
    const resolved = resolveMove(move, moveStateOf("normal", "duel"));
    expect(resolved.startup).toBe(10);
  });

  test("phase='field' では fieldPhase 差分で上書きする", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      fieldPhase: { startup: 6 },
    });
    const resolved = resolveMove(move, moveStateOf("normal", "field"));
    expect(resolved.startup).toBe(6);
  });

  test("フィールドフェイズかつ共鳴時は、共鳴の値が fieldPhase より優先される", () => {
    // fieldPhase と resonance が同じ項目 (startup) を定義した場合の適用順の確認。
    // フェイズ層が先頭（最弱）のため、共鳴の値が最終的に効く。
    const move = makeMove({
      id: "move",
      startup: 10,
      fieldPhase: { startup: 6 },
      resonance: { startup: 4 },
    });
    const resolved = resolveMove(move, moveStateOf("resonance", "field"));
    expect(resolved.startup).toBe(4);
  });

  test("phase='field' ではコマンドも上書きされる（フェイズで入力が変わる技）", () => {
    const move = makeMove({
      id: "move",
      command: "5A",
      fieldPhase: { command: "6A" },
    });
    expect(resolveMove(move, moveStateOf("normal", "duel")).command).toBe("5A");
    expect(resolveMove(move, moveStateOf("normal", "field")).command).toBe("6A");
  });

  test("フィールドフェイズと共鳴が別項目を変える場合は両方効く", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      baseDamage: 20,
      fieldPhase: { startup: 6 },
      resonance: { baseDamage: 25 },
    });
    const resolved = resolveMove(move, moveStateOf("resonance", "field"));
    expect(resolved.startup).toBe(6);
    expect(resolved.baseDamage).toBe(25);
  });
});

describe("resolveFieldPhaseMove", () => {
  test("fieldPhase が無ければ undefined", () => {
    const move = makeMove({ id: "move" });
    expect(resolveFieldPhaseMove(move)).toBeUndefined();
  });

  test("fieldPhase の差分をベース値に適用した Move を返す", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      guardFrameAdvantage: -5,
      fieldPhase: { startup: 6 },
    });
    const resolved = resolveFieldPhaseMove(move);
    expect(resolved?.startup).toBe(6);
    expect(resolved?.guardFrameAdvantage).toBe(-5);
    expect(resolved?.id).toBe(move.id);
  });

  test("resonance には「FP版が共鳴でどう変わるか」を詰め替える", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      fieldPhase: { startup: 6 },
      resonance: { startup: 4 },
    });
    const resolved = resolveFieldPhaseMove(move);
    // フェイズ層より共鳴層が優先されるため、FP かつ共鳴時は resonance の値 4 になる。
    expect(resolved?.resonance).toEqual({ startup: 4 });
  });

  test("コマンドはFP版に反映され、共鳴差分には混ざらない", () => {
    const move = makeMove({
      id: "move",
      command: "5A",
      fieldPhase: { command: "6A" },
      resonance: { startup: 4 },
    });
    const resolved = resolveFieldPhaseMove(move);
    expect(resolved?.command).toBe("6A");
    // command はフェイズ固有の項目。共鳴の「→」併記に現れてはいけない。
    expect(resolved?.resonance).toEqual({ startup: 4 });
  });
});

describe("moveColumnKey", () => {
  test("フェイズ差もジャスト入力も無い列は技 ID そのまま（既存アンカーとの互換）", () => {
    expect(moveColumnKey("move", { phase: "duel", justInput: false })).toBe("move");
  });

  test("4通りの組み合わせがすべて異なるキーになる", () => {
    const keys = [
      moveColumnKey("move", { phase: "duel", justInput: false }),
      moveColumnKey("move", { phase: "duel", justInput: true }),
      moveColumnKey("move", { phase: "field", justInput: false }),
      moveColumnKey("move", { phase: "field", justInput: true }),
    ];
    expect(keys).toEqual(["move", "move-just", "move-field", "move-field-just"]);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("resolveJustInputMove: フィールドフェイズとの組み合わせ", () => {
  test("phase='field' を渡すと fieldPhase を適用した上でジャスト入力を上書きする", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      fieldPhase: { startup: 6 },
      justInput: { startup: 3 },
    });
    const resolvedDuel = resolveJustInputMove(move, "duel");
    const resolvedField = resolveJustInputMove(move, "field");
    // duel 側は fieldPhase の影響を受けないので justInput の値がそのまま効く。
    expect(resolvedDuel?.startup).toBe(3);
    // field 側も justInput が最終的に上書きするため、この技では同じ値になる
    // （justInput が fieldPhase より強い層のため）。
    expect(resolvedField?.startup).toBe(3);
  });

  test("justInput が fieldPhase の項目に触れなければ、field 側は fieldPhase の値が残る", () => {
    const move = makeMove({
      id: "move",
      startup: 10,
      baseDamage: 20,
      fieldPhase: { startup: 6 },
      justInput: { baseDamage: 30 },
    });
    const resolvedField = resolveJustInputMove(move, "field");
    expect(resolvedField?.startup).toBe(6);
    expect(resolvedField?.baseDamage).toBe(30);
  });
});
