import { describe, expect, test } from "bun:test";
import {
  draftRowsToPhaseChangePoints,
  phaseChangePointsToDraftRows,
} from "@/lib/moves/phaseChangePoints";

describe("phaseChangePointsToDraftRows", () => {
  test("未設定なら空欄1行", () => {
    expect(phaseChangePointsToDraftRows(undefined)).toEqual([
      { perHit: "", hitCount: "" },
    ]);
  });

  test("単一値ならヒット数欄が空欄の1行", () => {
    expect(phaseChangePointsToDraftRows(3.5)).toEqual([
      { perHit: 3.5, hitCount: "" },
    ]);
  });

  test("区切りの配列は1区切り1行に展開する", () => {
    expect(
      phaseChangePointsToDraftRows([
        { perHit: 5, hitCount: 1 },
        { perHit: 3.5, hitCount: 4 },
      ]),
    ).toEqual([
      { perHit: 5, hitCount: 1 },
      { perHit: 3.5, hitCount: 4 },
    ]);
  });
});

describe("draftRowsToPhaseChangePoints", () => {
  test("perHit が空欄の行しか無ければ undefined", () => {
    expect(
      draftRowsToPhaseChangePoints([{ perHit: "", hitCount: "" }]),
    ).toBeUndefined();
  });

  test("1行だけでヒット数が空欄なら単一値（number）にする", () => {
    expect(draftRowsToPhaseChangePoints([{ perHit: 3.5, hitCount: "" }])).toBe(
      3.5,
    );
  });

  test("1行だけでヒット数が1なら単一値（number）にする", () => {
    expect(draftRowsToPhaseChangePoints([{ perHit: 3.5, hitCount: 1 }])).toBe(
      3.5,
    );
  });

  test("1行でもヒット数が2以上なら区切りの配列にする", () => {
    expect(
      draftRowsToPhaseChangePoints([{ perHit: 3.5, hitCount: 4 }]),
    ).toEqual([{ perHit: 3.5, hitCount: 4 }]);
  });

  test("複数行なら区切りの配列にする（ヒット数空欄の行は1として扱う）", () => {
    expect(
      draftRowsToPhaseChangePoints([
        { perHit: 5, hitCount: "" },
        { perHit: 3.5, hitCount: 4 },
      ]),
    ).toEqual([
      { perHit: 5, hitCount: 1 },
      { perHit: 3.5, hitCount: 4 },
    ]);
  });

  test("perHit が空欄の行は無視して詰める", () => {
    expect(
      draftRowsToPhaseChangePoints([
        { perHit: 5, hitCount: 1 },
        { perHit: "", hitCount: "" },
        { perHit: 3.5, hitCount: 4 },
      ]),
    ).toEqual([
      { perHit: 5, hitCount: 1 },
      { perHit: 3.5, hitCount: 4 },
    ]);
  });
});
