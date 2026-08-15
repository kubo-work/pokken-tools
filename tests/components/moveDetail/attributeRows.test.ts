import { describe, expect, test } from "bun:test";
import { resonanceStrength } from "@/components/moveDetail/attributeRows";
import type { Move } from "@/types/move";

/** resonanceStrength のテストに使う最小の有効な技。各テストはこれを部分的に上書きする。 */
const baseMove: Move = {
  id: "test_move",
  name: "テスト技",
  command: "Y",
  category: "attack",
  attackType: "projectile",
  guardLevel: "mid",
  startup: 10,
  guardFrameAdvantage: -5,
  strength: 5,
};

describe("resonanceStrength: 共鳴の強度の表示テキスト", () => {
  test("共鳴の単一値が記号なら ◎ / ● で表示する（\"erase\"/\"inert\" のまま出ない）", () => {
    expect(
      resonanceStrength({ ...baseMove, resonance: { strength: "erase" } }),
    ).toBe("◎");
    expect(
      resonanceStrength({ ...baseMove, resonance: { strength: "inert" } }),
    ).toBe("●");
  });

  test("共鳴の単一値が数値ならそのまま文字列で表示する", () => {
    expect(
      resonanceStrength({ ...baseMove, resonance: { strength: 9 } }),
    ).toBe("9");
  });

  test("共鳴のヒット内訳が強度を定義していれば内訳側を優先する（記号でも同様）", () => {
    expect(
      resonanceStrength({
        ...baseMove,
        resonance: {
          strength: 9,
          hitBreakdown: [{ hitCount: 1, strength: "erase" }],
        },
      }),
    ).toBe("1ヒット目: ◎");
  });

  test("共鳴の上書きが無ければ undefined", () => {
    expect(resonanceStrength(baseMove)).toBeUndefined();
  });
});
