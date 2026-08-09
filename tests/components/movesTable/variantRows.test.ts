import { describe, expect, test } from "bun:test";
import { buildVariantRows } from "@/components/movesTable/variantRows";
import { isPhaseInvariantCell } from "@/lib/moves/fieldPhaseDisplay";
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

describe("buildVariantRows: フェイズ差の無い技", () => {
  test("1行のみで、フェイズを名乗らず結合もしない", () => {
    const { rows, fieldPhaseDiffKeys } = buildVariantRows(
      makeMove({ id: "move" }),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.usagePhase).toBeUndefined();
    expect(fieldPhaseDiffKeys).toBeUndefined();
  });

  test("ジャスト入力がある技は本体とジャスト行の2行（従来の並び）", () => {
    const { rows } = buildVariantRows(
      makeMove({ id: "move", justInput: { startup: 6 } }),
    );
    expect(rows.map((row) => row.key)).toEqual(["move", "move-just"]);
    expect(rows.map((row) => row.isJustInputRow)).toEqual([false, true]);
  });
});

describe("buildVariantRows: フェイズ差のある技", () => {
  test("DP行とFP行が縦に隣接する（rowSpan で結合するための前提）", () => {
    const { rows } = buildVariantRows(
      makeMove({ id: "move", fieldPhase: { startup: 12 } }),
    );
    expect(rows.map((row) => row.key)).toEqual(["move", "move-field"]);
    expect(rows.map((row) => row.usagePhase)).toEqual(["duel", "field"]);
  });

  test("ジャスト入力もある場合、DP/FP の対が隣接したまま並ぶ", () => {
    const { rows } = buildVariantRows(
      makeMove({
        id: "move",
        fieldPhase: { startup: 12 },
        justInput: { startup: 6 },
      }),
    );
    expect(rows.map((row) => row.key)).toEqual([
      "move",
      "move-field",
      "move-just",
      "move-field-just",
    ]);
    expect(rows.map((row) => row.usagePhase)).toEqual([
      "duel",
      "field",
      "duel",
      "field",
    ]);
  });

  test("FP行の技はフェイズ上書きが適用済み", () => {
    const { rows } = buildVariantRows(
      makeMove({
        id: "move",
        command: "5A",
        startup: 10,
        fieldPhase: { command: "6A", startup: 12 },
      }),
    );
    expect(rows[0]!.move.command).toBe("5A");
    expect(rows[0]!.move.startup).toBe(10);
    expect(rows[1]!.move.command).toBe("6A");
    expect(rows[1]!.move.startup).toBe(12);
  });

  test("変更項目が結合判定の材料として返る", () => {
    const { fieldPhaseDiffKeys } = buildVariantRows(
      makeMove({ id: "move", fieldPhase: { command: "6A", baseDamage: 30 } }),
    );
    expect(fieldPhaseDiffKeys).toEqual(["command", "baseDamage"]);
  });
});

describe("buildVariantRows: 親のコマンドがフェイズで変わる子技", () => {
  /** DPでは 5A、FPでは 6A になる親技。 */
  const parentMove = makeMove({
    id: "parent",
    command: "5A",
    fieldPhase: { command: "6A" },
  });
  /** 追加入力だけを持つ派生技（表示コマンドは 親コマンド + " > " + Y）。 */
  const childMove = makeMove({
    id: "child",
    command: "Y",
    variant: "derivative",
    parentMoveId: "parent",
  });

  test("子自身に fieldPhase が無くても DP/FP 行に分かれる", () => {
    // 表示コマンドが親由来で変わるため、1行にまとめると FP の値を出せない。
    const { rows } = buildVariantRows(childMove, parentMove);
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.usagePhase)).toEqual(["duel", "field"]);
  });

  test("行ごとにフェイズを合わせた親コマンドを持つ", () => {
    const { rows } = buildVariantRows(childMove, parentMove);
    expect(rows[0]!.parentCommand).toBe("5A");
    expect(rows[1]!.parentCommand).toBe("6A");
  });

  test("コマンドは結合対象から外れる（値が違うため）", () => {
    const { fieldPhaseDiffKeys } = buildVariantRows(childMove, parentMove);
    expect(fieldPhaseDiffKeys).toEqual(["command"]);
    expect(isPhaseInvariantCell(fieldPhaseDiffKeys!, ["command"])).toBe(false);
    // コマンド以外は両フェイズで同じなので結合できる。
    expect(isPhaseInvariantCell(fieldPhaseDiffKeys!, ["startup"])).toBe(true);
  });

  test("親のコマンドが変わらなければ子は従来どおり1行", () => {
    const plainParent = makeMove({ id: "parent", command: "5A" });
    const { rows, fieldPhaseDiffKeys } = buildVariantRows(
      childMove,
      plainParent,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.parentCommand).toBe("5A");
    expect(fieldPhaseDiffKeys).toBeUndefined();
  });

  test("子自身にもフェイズ差がある場合、両方の変更項目が結合対象から外れる", () => {
    const { fieldPhaseDiffKeys } = buildVariantRows(
      { ...childMove, fieldPhase: { startup: 12 } },
      parentMove,
    );
    expect(fieldPhaseDiffKeys).toEqual(["startup", "command"]);
  });
});

describe("isPhaseInvariantCell", () => {
  test("変更項目に依存しないセルは結合できる", () => {
    // 攻撃属性・判定など、そもそもフェイズで変わらない項目のセル。
    expect(isPhaseInvariantCell(["startup"], [])).toBe(true);
    expect(isPhaseInvariantCell(["startup"], ["command"])).toBe(true);
  });

  test("変更項目に依存するセルは結合しない", () => {
    expect(isPhaseInvariantCell(["startup"], ["startup"])).toBe(false);
    // ガード硬直差セルはキャンセル時の値も表示するため、どちらが変わっても結合しない。
    expect(
      isPhaseInvariantCell(
        ["guardFrameAdvantageOnPokemonMoveCancel"],
        ["guardFrameAdvantage", "guardFrameAdvantageOnPokemonMoveCancel"],
      ),
    ).toBe(false);
  });

  test("ヒット内訳が変わっている技は一切結合しない", () => {
    // 内訳はダメージ・判定・空地の表示を横断的に変えるため、安全側に倒す。
    expect(isPhaseInvariantCell(["hitBreakdown"], [])).toBe(false);
    expect(isPhaseInvariantCell(["hitBreakdown"], ["command"])).toBe(false);
  });
});
