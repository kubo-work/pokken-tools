import { describe, expect, test } from "bun:test";
import type { Move } from "@/types/move";
import {
  DEFAULT_SWITCH_ACTIVE_FRAME,
  setMoveAttackType,
  setMoveCategory,
  setMoveField,
  setMoveResonanceFlinchMode,
  setMoveSpecialAttributes,
  setOptionalMoveField,
} from "@/lib/moves/moveUpdaters";
import { makeMove } from "./testFixtures";

/** 攻撃系フィールドを一通り持つ技。属性変更で何が消えるかの検証に使う。 */
const attackMove: Move = makeMove({
  id: "attack_move",
  category: "attack",
  attackType: "strike",
  strength: 5,
  guardLevel: "mid",
  resonanceFlinch: "strong",
});

describe("setMoveField", () => {
  test("指定したフィールドだけ差し替える", () => {
    const next = setMoveField(attackMove, "startup", 14);
    expect(next.startup).toBe(14);
    expect(next.command).toBe(attackMove.command);
  });

  test("元の Move を変更しない（イミュータブル）", () => {
    const snapshot = JSON.parse(JSON.stringify(attackMove));
    setMoveField(attackMove, "startup", 14);
    expect(attackMove).toEqual(snapshot);
  });
});

describe("setOptionalMoveField", () => {
  test("値を指定すると設定される", () => {
    expect(setOptionalMoveField(attackMove, "activeUntilFrame", 27)
      .activeUntilFrame).toBe(27);
  });

  test("undefined を渡すとキーごと削除される", () => {
    const withValue = setOptionalMoveField(attackMove, "activeUntilFrame", 27);
    const next = setOptionalMoveField(withValue, "activeUntilFrame", undefined);
    // { activeUntilFrame: undefined } として残ると JSON 化したときにフィールドが出てしまう。
    expect("activeUntilFrame" in next).toBe(false);
  });
});

describe("setMoveCategory", () => {
  test("attack なら攻撃系フィールドを保持する", () => {
    expect(setMoveCategory(attackMove, "attack")).toEqual(attackMove);
  });

  test("block なら攻撃系フィールドを保持する", () => {
    expect(setMoveCategory(attackMove, "block")).toEqual({
      ...attackMove,
      category: "block",
    });
  });

  test("grab なら攻撃属性・強度・共鳴怯ませが消え、判定は null になる", () => {
    const next = setMoveCategory(attackMove, "grab");
    expect(next.category).toBe("grab");
    expect("attackType" in next).toBe(false);
    expect("strength" in next).toBe(false);
    expect("resonanceFlinch" in next).toBe(false);
    expect(next.guardLevel).toBeNull();
  });

  test("属性なし（undefined）なら攻撃系フィールドに加えて category も消える", () => {
    const next = setMoveCategory(attackMove, undefined);
    expect("category" in next).toBe(false);
    expect("attackType" in next).toBe(false);
    expect("strength" in next).toBe(false);
    expect("resonanceFlinch" in next).toBe(false);
    expect(next.guardLevel).toBeNull();
  });
});

describe("setMoveAttackType", () => {
  test("値を指定するとそのまま設定され、他の攻撃系フィールドは残る", () => {
    const next = setMoveAttackType(attackMove, "projectile");
    expect(next.attackType).toBe("projectile");
    expect(next.strength).toBe(5);
    expect(next.resonanceFlinch).toBe("strong");
  });

  test("undefined なら攻撃系フィールドが一括で消え、判定は null になる", () => {
    const next = setMoveAttackType(attackMove, undefined);
    expect("attackType" in next).toBe(false);
    expect("strength" in next).toBe(false);
    expect("resonanceFlinch" in next).toBe(false);
    expect(next.guardLevel).toBeNull();
  });

  test("undefined にしても category は維持される（攻撃属性とは別軸のため）", () => {
    expect(setMoveAttackType(attackMove, undefined).category).toBe("attack");
  });
});

describe("setMoveResonanceFlinchMode", () => {
  test("null なら共鳴怯ませ強度をキーごと削除する", () => {
    const next = setMoveResonanceFlinchMode(attackMove, null, undefined);
    expect("resonanceFlinch" in next).toBe(false);
  });

  test("weak / strong は単一値として設定される", () => {
    expect(
      setMoveResonanceFlinchMode(attackMove, "weak", undefined).resonanceFlinch,
    ).toBe("weak");
    expect(
      setMoveResonanceFlinchMode(attackMove, "strong", undefined)
        .resonanceFlinch,
    ).toBe("strong");
  });

  test("transition は切替フレーム付きオブジェクトになる", () => {
    expect(
      setMoveResonanceFlinchMode(attackMove, "transition", 6).resonanceFlinch,
    ).toEqual({ switchActiveFrame: 6 });
  });

  test("transition で切替フレーム未指定なら既定値で補完する", () => {
    expect(
      setMoveResonanceFlinchMode(attackMove, "transition", undefined)
        .resonanceFlinch,
    ).toEqual({ switchActiveFrame: DEFAULT_SWITCH_ACTIVE_FRAME });
  });
});

describe("setMoveSpecialAttributes", () => {
  /** 弾消しと、その開始フレームを持つ技。 */
  const nullifyMove: Move = makeMove({
    id: "nullify_move",
    specialAttributes: ["projectileNullify"],
    projectileNullifyStartFrame: 12,
  });

  test("空配列なら specialAttributes 自体を削除する", () => {
    const next = setMoveSpecialAttributes(nullifyMove, []);
    expect("specialAttributes" in next).toBe(false);
  });

  test("弾消しを含むなら開始フレームは保持される", () => {
    const next = setMoveSpecialAttributes(nullifyMove, [
      "projectileNullify",
      "armor",
    ]);
    expect(next.specialAttributes).toEqual(["projectileNullify", "armor"]);
    expect(next.projectileNullifyStartFrame).toBe(12);
  });

  test("弾消しを外すと開始フレームも一緒に削除される", () => {
    const next = setMoveSpecialAttributes(nullifyMove, ["armor"]);
    expect(next.specialAttributes).toEqual(["armor"]);
    // 「開始フレームは弾消し属性を持つ技のみ」の不変条件。
    expect("projectileNullifyStartFrame" in next).toBe(false);
  });

  test("空配列にしたときも開始フレームは削除される", () => {
    const next = setMoveSpecialAttributes(nullifyMove, []);
    expect("projectileNullifyStartFrame" in next).toBe(false);
  });
});
