import { describe, expect, test } from "bun:test";
import type { HitBreakdownEntry, Move, MoveOverrideBase } from "@/types/move";
import {
  setFieldPhaseHitBreakdown,
  setJustInputAcceptFrames,
  setJustInputHitBreakdown,
  setJustInputResonanceHitBreakdown,
  setOptionalFieldPhaseField,
  setOptionalJustInputField,
  setOptionalJustInputResonanceField,
  setOptionalResonanceField,
  setResonanceHitBreakdown,
  toggleFieldPhase,
  toggleJustInput,
  toggleJustInputResonance,
  toggleResonance,
} from "@/lib/moves/moveOverrideUpdaters";
import { makeMove } from "./testFixtures";

const baseMove = makeMove({ id: "test_move" });

/**
 * 条件付き差分を 1 フィールド更新する 4 つの公開関数は、内部の setOptionalOverrideField を
 * 共有している。1 経路だけ検証すると共有部分を壊したときに巻き添えを名指しできないため、
 * 差分の位置だけを差し替えて同じ検証を 4 経路すべてに適用する。
 *
 * 検証キーに startup を使うのは MoveOverrideBase 由来で 4 つの差分型すべてが持つため。
 */
interface OverridePathCase {
  name: string;
  setStartup: (move: Move, value: number | undefined) => Move;
  read: (move: Move) => MoveOverrideBase | undefined;
  /** 更新対象とは別のフィールドを既に持つ状態。既存値が保持されるかの検証に使う。 */
  withExistingField: (move: Move) => Move;
}

const OVERRIDE_PATHS: OverridePathCase[] = [
  {
    name: "setOptionalResonanceField（共鳴差分）",
    setStartup: (move, value) =>
      setOptionalResonanceField(move, "startup", value),
    read: (move) => move.resonance,
    withExistingField: (move) => ({
      ...move,
      resonance: { guardFrameAdvantage: -3 },
    }),
  },
  {
    name: "setOptionalJustInputField（ジャスト入力差分）",
    setStartup: (move, value) =>
      setOptionalJustInputField(move, "startup", value),
    read: (move) => move.justInput,
    withExistingField: (move) => ({
      ...move,
      justInput: { guardFrameAdvantage: -3 },
    }),
  },
  {
    name: "setOptionalJustInputResonanceField（共鳴中のジャスト入力差分）",
    setStartup: (move, value) =>
      setOptionalJustInputResonanceField(move, "startup", value),
    read: (move) => move.justInput?.resonance,
    withExistingField: (move) => ({
      ...move,
      justInput: { resonance: { guardFrameAdvantage: -3 } },
    }),
  },
  {
    name: "setOptionalFieldPhaseField（フィールドフェイズ差分）",
    setStartup: (move, value) =>
      setOptionalFieldPhaseField(move, "startup", value),
    read: (move) => move.fieldPhase,
    withExistingField: (move) => ({
      ...move,
      fieldPhase: { guardFrameAdvantage: -3 },
    }),
  },
];

for (const path of OVERRIDE_PATHS) {
  describe(path.name, () => {
    test("値を指定すると差分に設定される", () => {
      expect(path.read(path.setStartup(baseMove, 8))?.startup).toBe(8);
    });

    test("undefined を渡すとキーごと削除される", () => {
      const withValue = path.setStartup(baseMove, 8);
      const override = path.read(path.setStartup(withValue, undefined));
      expect(override).toBeDefined();
      // { startup: undefined } として残ると JSON 化したときにフィールドが出てしまう。
      expect("startup" in override!).toBe(false);
    });

    test("同じ差分の他フィールドは保持される", () => {
      const next = path.setStartup(path.withExistingField(baseMove), 8);
      expect(path.read(next)).toEqual({ guardFrameAdvantage: -3, startup: 8 });
    });

    test("元の Move を変更しない（イミュータブル）", () => {
      const move = path.withExistingField(baseMove);
      const snapshot = JSON.parse(JSON.stringify(move));
      path.setStartup(move, 8);
      expect(move).toEqual(snapshot);
    });
  });
}

describe("toggleResonance", () => {
  test("ON かつ未設定なら空オブジェクトで初期化する", () => {
    expect(toggleResonance(baseMove, true).resonance).toEqual({});
  });

  test("ON かつ既存の差分があれば維持する", () => {
    const move: Move = { ...baseMove, resonance: { startup: 8 } };
    expect(toggleResonance(move, true).resonance).toEqual({ startup: 8 });
  });

  test("OFF なら差分ごと削除される", () => {
    const move: Move = { ...baseMove, resonance: { startup: 8 } };
    expect(toggleResonance(move, false).resonance).toBeUndefined();
  });
});

describe("toggleJustInput", () => {
  test("ON かつ未設定なら空オブジェクトで初期化する", () => {
    expect(toggleJustInput(baseMove, true).justInput).toEqual({});
  });

  test("ON かつ既存の差分があれば維持する", () => {
    const move: Move = { ...baseMove, justInput: { startup: 8 } };
    expect(toggleJustInput(move, true).justInput).toEqual({ startup: 8 });
  });

  test("OFF なら差分ごと削除される", () => {
    const move: Move = { ...baseMove, justInput: { startup: 8 } };
    expect(toggleJustInput(move, false).justInput).toBeUndefined();
  });
});

describe("toggleFieldPhase", () => {
  test("ON かつ未設定なら空オブジェクトで初期化する", () => {
    expect(toggleFieldPhase(baseMove, true).fieldPhase).toEqual({});
  });

  test("ON かつ既存の差分があれば維持する", () => {
    const move: Move = { ...baseMove, fieldPhase: { command: "6A" } };
    expect(toggleFieldPhase(move, true).fieldPhase).toEqual({ command: "6A" });
  });

  test("OFF なら差分ごと削除される", () => {
    const move: Move = { ...baseMove, fieldPhase: { command: "6A" } };
    expect(toggleFieldPhase(move, false).fieldPhase).toBeUndefined();
  });
});

describe("toggleJustInputResonance", () => {
  const justInputMove: Move = { ...baseMove, justInput: { startup: 8 } };

  test("ON かつ未設定なら空オブジェクトで初期化し、他のジャスト入力差分は保持する", () => {
    expect(toggleJustInputResonance(justInputMove, true).justInput).toEqual({
      startup: 8,
      resonance: {},
    });
  });

  test("ON かつ既存の差分があれば維持する", () => {
    const move: Move = {
      ...baseMove,
      justInput: { startup: 8, resonance: { guardFrameAdvantage: -3 } },
    };
    expect(toggleJustInputResonance(move, true).justInput?.resonance).toEqual({
      guardFrameAdvantage: -3,
    });
  });

  test("OFF なら resonance だけ消え、他のジャスト入力差分は残る", () => {
    const move: Move = {
      ...baseMove,
      justInput: { startup: 8, resonance: { guardFrameAdvantage: -3 } },
    };
    const next = toggleJustInputResonance(move, false);
    expect(next.justInput?.resonance).toBeUndefined();
    expect(next.justInput?.startup).toBe(8);
  });

  /**
   * JSDoc は「ジャスト入力自体は既に ON の前提で呼ぶ」と述べているが、コードはそれを
   * 強制していない。前提を外れた呼び方をしたときに何が起きるかを記録しておく
   * （呼び出し側が前提を守らなくなったときに、この挙動に気づけるようにする）。
   */
  test("ジャスト入力が未設定の技に ON すると justInput 自体が生成される", () => {
    expect(baseMove.justInput).toBeUndefined();
    expect(toggleJustInputResonance(baseMove, true).justInput).toEqual({
      resonance: {},
    });
  });
});

describe("setJustInputAcceptFrames", () => {
  test("受付フレーム範囲を設定する", () => {
    const next = setJustInputAcceptFrames(baseMove, { start: 3, end: 5 });
    expect(next.justInput?.acceptFrames).toEqual({ start: 3, end: 5 });
  });

  test("undefined なら未計測扱いでキーごと削除する", () => {
    const withRange = setJustInputAcceptFrames(baseMove, { start: 3, end: 5 });
    const next = setJustInputAcceptFrames(withRange, undefined);
    expect("acceptFrames" in next.justInput!).toBe(false);
  });
});

/**
 * 内訳更新そのもの（単一値との相互排他）は moveHitBreakdownUpdaters.test.ts が検証済みなので、
 * ここは各ラッパーが正しい差分の位置へ委譲しているかだけを確認する。
 */
describe("hitBreakdown 系ラッパーの書き込み先", () => {
  const entries: HitBreakdownEntry[] = [
    { hitCount: 1, baseDamage: 50 },
    { hitCount: 3, baseDamage: 45 },
  ];

  test("setResonanceHitBreakdown は共鳴差分に書き込む", () => {
    const next = setResonanceHitBreakdown(baseMove, entries);
    expect(next.resonance?.hitBreakdown).toEqual(entries);
    expect("hitBreakdown" in next).toBe(false);
  });

  test("setJustInputHitBreakdown はジャスト入力差分に書き込む", () => {
    const next = setJustInputHitBreakdown(baseMove, entries);
    expect(next.justInput?.hitBreakdown).toEqual(entries);
    expect("hitBreakdown" in next).toBe(false);
  });

  test("setJustInputResonanceHitBreakdown は共鳴中のジャスト入力差分に書き込む", () => {
    const next = setJustInputResonanceHitBreakdown(baseMove, entries);
    expect(next.justInput?.resonance?.hitBreakdown).toEqual(entries);
    expect("hitBreakdown" in next).toBe(false);
  });

  test("setFieldPhaseHitBreakdown はフィールドフェイズ差分に書き込む", () => {
    const next = setFieldPhaseHitBreakdown(baseMove, entries);
    expect(next.fieldPhase?.hitBreakdown).toEqual(entries);
    expect("hitBreakdown" in next).toBe(false);
  });
});
