import { describe, expect, test } from "bun:test";
import { buildVariantColumns } from "@/components/moveDetail/variantColumn";
import type { Move } from "@/types/move";

/** テスト用の最小の有効な技。上書きしたい項目だけ指定する。 */
const makeMove = (overrides: Partial<Move> & { id: string }): Move => ({
  name: overrides.id,
  command: "Y",
  guardLevel: null,
  startup: 10,
  guardFrameAdvantage: -5,
  ...overrides,
});

const CHARGE_MAX_LEVEL = 0;

describe("buildVariantColumns: フェイズ差の無い技", () => {
  test("列は1つで、フェイズを名乗らない（従来表示の維持）", () => {
    const move = makeMove({ id: "move" });
    const columns = buildVariantColumns(move, move, CHARGE_MAX_LEVEL);
    expect(columns).toHaveLength(1);
    expect(columns[0]!.key).toBe("move");
    expect(columns[0]!.label).toBe("通常");
    expect(columns[0]!.fieldPhaseDiffKeys).toBeUndefined();
  });

  test("ジャスト入力がある技は本体とジャスト列の2列", () => {
    const move = makeMove({ id: "move", justInput: { startup: 6 } });
    const columns = buildVariantColumns(move, move, CHARGE_MAX_LEVEL);
    expect(columns.map((column) => column.key)).toEqual([
      "move",
      "move-just",
    ]);
    expect(columns.map((column) => column.label)).toEqual([
      "通常",
      "通常ジャスト",
    ]);
  });
});

describe("buildVariantColumns: フェイズ差のある技", () => {
  test("DP列とFP列が隣接し、両方がフェイズを名乗る", () => {
    const move = makeMove({ id: "move", fieldPhase: { startup: 12 } });
    const columns = buildVariantColumns(move, move, CHARGE_MAX_LEVEL);
    expect(columns.map((column) => column.key)).toEqual([
      "move",
      "move-field",
    ]);
    expect(columns.map((column) => column.label)).toEqual(["通常DP", "通常FP"]);
  });

  test("ジャスト入力もある場合、DP/FP の対を崩さず並ぶ", () => {
    // 結合には対が隣接している必要があるため、フェイズ優先ではなくジャスト有無で区切る。
    const move = makeMove({
      id: "move",
      fieldPhase: { startup: 12 },
      justInput: { startup: 6 },
    });
    const columns = buildVariantColumns(move, move, CHARGE_MAX_LEVEL);
    expect(columns.map((column) => column.key)).toEqual([
      "move",
      "move-field",
      "move-just",
      "move-field-just",
    ]);
    expect(columns.map((column) => column.label)).toEqual([
      "通常DP",
      "通常FP",
      "通常DPジャスト",
      "通常FPジャスト",
    ]);
  });

  test("FP列だけが fieldPhase の変更項目を持つ（結合判定の材料）", () => {
    const move = makeMove({
      id: "move",
      fieldPhase: { startup: 12, command: "6A" },
    });
    const columns = buildVariantColumns(move, move, CHARGE_MAX_LEVEL);
    expect(columns[0]!.fieldPhaseDiffKeys).toBeUndefined();
    expect(columns[1]!.fieldPhaseDiffKeys).toEqual(["startup", "command"]);
  });

  test("親のコマンドがフェイズで変わる子技は、自身に fieldPhase が無くても DP/FP 列に分かれる", () => {
    // 表示コマンドは「親コマンド + 追加入力」なので、親が変われば子の表示も変わる。
    const parentMove = makeMove({
      id: "parent",
      command: "5A",
      fieldPhase: { command: "6A" },
    });
    const childMove = makeMove({
      id: "child",
      command: "Y",
      variant: "derivative",
      parentMoveId: "parent",
    });
    const columns = buildVariantColumns(childMove, parentMove, CHARGE_MAX_LEVEL);
    expect(columns).toHaveLength(2);
    // 列ごとにフェイズを合わせた親コマンドを持つ（コマンド行はこれを使って組み立てる）。
    expect(columns[0]!.parentCommand).toBe("5A");
    expect(columns[1]!.parentCommand).toBe("6A");
    // コマンドは値が違うため結合対象から外れる。
    expect(columns[1]!.fieldPhaseDiffKeys).toEqual(["command"]);
  });

  test("親技自身の列は親コマンドを持たない", () => {
    const move = makeMove({ id: "move", fieldPhase: { startup: 12 } });
    const columns = buildVariantColumns(move, move, CHARGE_MAX_LEVEL);
    expect(columns[0]!.parentCommand).toBeUndefined();
    expect(columns[1]!.parentCommand).toBeUndefined();
  });

  test("FP列の技はフェイズ上書きが適用済み", () => {
    const move = makeMove({
      id: "move",
      command: "5A",
      startup: 10,
      fieldPhase: { command: "6A", startup: 12 },
    });
    const columns = buildVariantColumns(move, move, CHARGE_MAX_LEVEL);
    expect(columns[0]!.move.command).toBe("5A");
    expect(columns[0]!.move.startup).toBe(10);
    expect(columns[1]!.move.command).toBe("6A");
    expect(columns[1]!.move.startup).toBe(12);
  });
});
