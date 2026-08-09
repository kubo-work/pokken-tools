import { describe, expect, test } from "bun:test";
import { DAMAGE_ROWS } from "@/components/moveDetail/damageRows";
import { isPhaseInvariantCell } from "@/lib/moves/fieldPhaseDisplay";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";

const totalDamageRow = DAMAGE_ROWS.find(
  (row) => row.header === MOVE_FIELD_LABELS.totalDamage,
);

describe("合計ダメージ行の DP/FP セル結合", () => {
  test("基礎ダメージだけがフェイズで変わる技でも結合しない", () => {
    // 合計ダメージは多段ヒットの状態でしか表示されない（単発になるフェイズでは
    // resolveMove が落とす）ため、基礎ダメージがフェイズで変わるだけでも値が食い違う。
    expect(
      isPhaseInvariantCell(["baseDamage"], totalDamageRow!.phaseDependentKeys!),
    ).toBe(false);
  });

  test("合計ダメージ自体がフェイズで変わる技も結合しない", () => {
    expect(
      isPhaseInvariantCell(["totalDamage"], totalDamageRow!.phaseDependentKeys!),
    ).toBe(false);
  });

  test("ダメージに関係しない項目だけが変わる技は結合できる", () => {
    expect(
      isPhaseInvariantCell(["startup"], totalDamageRow!.phaseDependentKeys!),
    ).toBe(true);
  });
});
