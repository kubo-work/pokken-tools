# PCH値の小数点・ヒット数対応（Issue #79） Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PCH値（phaseChangePoints）に小数を入力できるようにし、ヒットごとに性能は変わらないが PCH だけ違う多段技のために「値×ヒット数」の区切りを任意個登録できるようにする。

**Architecture:** `phaseChangePoints` の型を `number` から `number | PhaseChangePointsSegment[]`（`PhaseChangePointsSegment = { perHit: number; hitCount: number }`）に拡張する。ヒット内訳（`HitBreakdownEntry.phaseChangePoints`）は既存どおり単一値のまま、小数のみ許可する。両者は既存の相互排他ルール（同じ層でヒット内訳と単一値を併用不可）をそのまま踏襲し、役割分担する: 「ダメージ等も含めてヒットごとに性能が変わる」技はヒット内訳、「PCH だけヒットごとに違う」技は PCH 専用の区切り配列。

**Tech Stack:** TypeScript, Zod（スキーマ検証）, React 19 + Mantine（管理画面 UI）, bun:test（テスト、型チェックはせず実行のみ）。

## Global Constraints

- PCH 値（`perHit`）は非負・小数可（整数制約なし）。全3箇所（技単位・上書き層・ヒット内訳）共通。
- 区切り（`PhaseChangePointsSegment`）の `hitCount` は 1 以上の整数（ダメージ系の `MULTI_HIT_MIN_COUNT=2` とは異なり、1ヒットの区切りも許可する）。
- 区切りの配列は1件以上必須（空配列は拒否）。
- 「値は同じなのに保存形式が2通りある」揺れを避けるため、有効な区切りが1つだけかつヒット数が1以下のときは `number` に正規化して保存する。
- 既存データ（`data/characters/*.json`）に `phaseChangePoints` は0件のため、データ移行は不要。D1マイグレーションも不要（技データは KV 保存の JSON、DB は `allowed_emails` テーブルのみ）。
- npm パッケージは追加しない（既存の Zod / Mantine の機能のみで実現できる）。
- 各タスクの完了確認は `bun test <対象ファイル>` を基本とする。`bun test` は型チェックをしないため、タスク A〜G の途中で `bun run typecheck` が一時的に失敗する区間があるのは想定内（最終タスク H で解消を確認する）。

---

### Task 1: PCH値の型とスキーマを拡張する

**Files:**
- Modify: `src/types/move.ts:40-44`（`PhaseChangePointsSegment`/`PhaseChangePointsValue` 追加）
- Modify: `src/types/move.ts:57-61`（`HitBreakdownEntry.phaseChangePoints` にコメント追加）
- Modify: `src/types/move.ts:103`（`MoveOverrideBase.phaseChangePoints` の型変更）
- Modify: `src/types/move.ts:250-251`（`Move.phaseChangePoints` の型変更）
- Modify: `src/lib/schema/fields.ts:49-61`（`phaseChangePointsSegmentSchema`/`phaseChangePointsValueSchema` 追加）
- Modify: `src/lib/schema/fields.ts:75`（`hitBreakdownEntrySchema.phaseChangePoints` の `.int()` 撤廃）
- Modify: `src/lib/schema/fields.ts:106`（`moveOverrideBaseSchema.phaseChangePoints` を新スキーマに差し替え）
- Modify: `src/lib/schema/moveObject.ts`（import 追加、`phaseChangePoints` を新スキーマに差し替え）
- Test: `tests/lib/schema.test.ts`

**Interfaces:**
- Produces: `PhaseChangePointsSegment { perHit: number; hitCount: number }`、`PhaseChangePointsValue = number | PhaseChangePointsSegment[]`（`src/types/move.ts` からエクスポート）。`Move.phaseChangePoints?: PhaseChangePointsValue`、`MoveOverrideBase.phaseChangePoints?: PhaseChangePointsValue`。`phaseChangePointsValueSchema`（`src/lib/schema/fields.ts` からエクスポート、Zod スキーマ）。

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/schema.test.ts` の `describe("moveSchema: ダメージ系の相互排他", () => { ... });`（206行目の `});`）の直後、`describe("moveSchema: 合計ダメージ", ...)`（208行目）の直前に以下を追加する。

```ts
describe("moveSchema: PCH値の小数点・区切り配列", () => {
  test("phaseChangePoints に小数を設定できる", () => {
    expectValid({ ...baseMove, phaseChangePoints: 3.5 });
  });

  test("上書き層（共鳴）の phaseChangePoints にも小数を設定できる", () => {
    expectValid({ ...baseMove, resonance: { phaseChangePoints: 12.25 } });
  });

  test("ヒット内訳の phaseChangePoints にも小数を設定できる", () => {
    expectValid({
      ...baseMove,
      hitBreakdown: [{ hitCount: 1, phaseChangePoints: 30.5 }],
    });
  });

  test("ヒットごとに違う PCH を区切りの配列で設定できる（1ヒットの区切りも許可）", () => {
    expectValid({
      ...baseMove,
      phaseChangePoints: [
        { perHit: 5, hitCount: 1 },
        { perHit: 3.5, hitCount: 4 },
      ],
    });
  });

  test("区切りの hitCount が 0 だと拒否される", () => {
    expectInvalid({
      ...baseMove,
      phaseChangePoints: [{ perHit: 5, hitCount: 0 }],
    });
  });

  test("区切りの perHit が負の値だと拒否される", () => {
    expectInvalid({
      ...baseMove,
      phaseChangePoints: [{ perHit: -1, hitCount: 1 }],
    });
  });

  test("区切りの配列が空だと拒否される", () => {
    expectInvalid({
      ...baseMove,
      phaseChangePoints: [],
    });
  });

  test("hitBreakdown が phaseChangePoints を定義していると、区切り配列形式でも技単位との併用はできない", () => {
    expectInvalid({
      ...baseMove,
      phaseChangePoints: [{ perHit: 5, hitCount: 1 }],
      hitBreakdown: [
        { hitCount: 1, phaseChangePoints: 30 },
        { hitCount: 3, phaseChangePoints: 10 },
      ],
    });
  });
});
```

- [ ] **Step 2: テストを実行し、失敗を確認する**

Run: `bun test tests/lib/schema.test.ts`
Expected: FAIL（小数・配列を渡したケースが現行スキーマ `z.number().int().nonnegative()` に弾かれる）

- [ ] **Step 3: 型定義を変更する**

`src/types/move.ts` の40-44行目（`DamageValue` 定義の直後）に以下を挿入する。

```ts
/**
 * PCH値の区切り1つ。ヒットごとに PCH が変わる技で、同じ値が連続するヒットのまとまり。
 * ダメージ系の多段表記（DamageValue のオブジェクト形）と違い hitCount は1以上を許す
 * （1ヒットだけ PCH が違う技を区切り1個で表せるようにするため）。
 */
export interface PhaseChangePointsSegment {
  perHit: number;
  hitCount: number;
}
/**
 * PCH値。単発・全ヒットで PCH が一定の多段技は number（小数可）、ヒットごとに PCH が
 * 変わる技は区切りの配列（例: 5×1 + 3.5×4 は [{perHit:5,hitCount:1},{perHit:3.5,hitCount:4}]）。
 * ヒット内訳（HitBreakdownEntry.phaseChangePoints）とは別の軸で、ダメージ等は変わらず
 * PCH だけ違う技のために使う。
 */
export type PhaseChangePointsValue = number | PhaseChangePointsSegment[];
```

`HitBreakdownEntry` 内の `phaseChangePoints?: number;`（元57-61行目付近）を以下に変更する。

```ts
  baseDamage?: number;
  chipDamage?: number;
  guardCrushValue?: number;
  /** 小数可。グループ内は単一値のため、ヒットごとに違う PCH は Move.phaseChangePoints の区切り配列側で表す。 */
  phaseChangePoints?: number;
  guardLevel?: GuardLevel;
```

`MoveOverrideBase` 内の `phaseChangePoints?: number;`（元103行目）を以下に変更する。

```ts
  guardCrushValue?: DamageValue;
  phaseChangePoints?: PhaseChangePointsValue;
  /** その条件下だけヒットごとの性能が変わる技向け。技単位の hitBreakdown と同じ規約。 */
  hitBreakdown?: HitBreakdownEntry[];
```

`Move` インターフェース内の `phaseChangePoints`（元250-251行目）を以下に変更する。

```ts
  /**
   * PCH値（フェイズチェンジポイント）。未計測なら省略。小数可。ヒットごとに PCH が
   * 変わる技は区切りの配列（PhaseChangePointsValue 参照）。
   */
  phaseChangePoints?: PhaseChangePointsValue;
```

- [ ] **Step 4: スキーマを変更する**

`src/lib/schema/fields.ts` の `damageValueSchema` 定義（49-61行目）の直後に以下を追加する。

```ts
/**
 * PCH値の区切り1つ。hitCount は1以上（ダメージ系の多段表記と違い、1ヒットの区切りも
 * 意味を持つため MULTI_HIT_MIN_COUNT を使わない）。
 */
export const phaseChangePointsSegmentSchema = z.object({
  perHit: z.number().nonnegative(),
  hitCount: z.number().int().min(1),
});

/**
 * PCH値。単発・全ヒット一定なら小数を許す単一の数値、ヒットごとに PCH が変わる技は
 * 区切りの配列（例: 5×1 + 3.5×4）。damageValueSchema と違い、1ヒットの区切りも許可し、
 * 値そのものに整数制約が無い。
 */
export const phaseChangePointsValueSchema = z.union([
  z.number().nonnegative(),
  z.array(phaseChangePointsSegmentSchema).min(1),
]);
```

`hitBreakdownEntrySchema` 内の `phaseChangePoints: z.number().int().nonnegative().optional(),`（75行目）を以下に変更する。

```ts
    phaseChangePoints: z.number().nonnegative().optional(),
```

`moveOverrideBaseSchema` 内の `phaseChangePoints: z.number().int().nonnegative().optional(),`（106行目）を以下に変更する。

```ts
  phaseChangePoints: phaseChangePointsValueSchema.optional(),
```

`src/lib/schema/moveObject.ts` の import 一覧に `phaseChangePointsValueSchema` を追加し、`moveObjectSchema` 内の `phaseChangePoints: z.number().int().nonnegative().optional(),`（55行目）を以下に変更する。

```ts
import {
  airGroundJudgmentSchema,
  attackTypeSchema,
  categorySchema,
  damageValueSchema,
  fieldPhaseOverrideSchema,
  guardFrameAdvantageSchema,
  guardLevelSchema,
  hitBreakdownSchema,
  hitFrameAdvantageSchema,
  justInputOverrideSchema,
  moveOverrideSchema,
  phaseChangePointsValueSchema,
  resonanceFlinchSchema,
  specialAttributeSchema,
  strengthSchema,
  totalDamageSchema,
  variantSchema,
} from "./fields";
```

```ts
  phaseChangePoints: phaseChangePointsValueSchema.optional(),
```

- [ ] **Step 5: テストを実行し、成功を確認する**

Run: `bun test tests/lib/schema.test.ts`
Expected: PASS（全テスト）

- [ ] **Step 6: コミット**

```bash
git add src/types/move.ts src/lib/schema/fields.ts src/lib/schema/moveObject.ts tests/lib/schema.test.ts
git commit -m "feat: PCH値に小数点と区切り配列を許可する"
```

---

### Task 2: PCH値の下書き行⇔保存値の変換関数を書く

管理画面の入力欄が「N行の値×ヒット数」を編集し、保存時に `PhaseChangePointsValue` へ正規化するための純粋関数。React に依存しないため単体でテストできる。

**Files:**
- Create: `src/lib/moves/phaseChangePoints.ts`
- Test: `tests/lib/moves/phaseChangePoints.test.ts`

**Interfaces:**
- Consumes: `PhaseChangePointsValue`、`PhaseChangePointsSegment`（Task 1 で `src/types/move.ts` に追加済み）。
- Produces: `PhaseChangePointsDraftRow { perHit: number | string; hitCount: number | string }`、`phaseChangePointsToDraftRows(value: PhaseChangePointsValue | undefined): PhaseChangePointsDraftRow[]`、`draftRowsToPhaseChangePoints(rows: PhaseChangePointsDraftRow[]): PhaseChangePointsValue | undefined`（Task 6 の `PhaseChangePointsField` が使う）。

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/moves/phaseChangePoints.test.ts` を新規作成する。

```ts
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
```

- [ ] **Step 2: テストを実行し、失敗を確認する**

Run: `bun test tests/lib/moves/phaseChangePoints.test.ts`
Expected: FAIL（`@/lib/moves/phaseChangePoints` が存在しない）

- [ ] **Step 3: 実装する**

`src/lib/moves/phaseChangePoints.ts` を新規作成する。

```ts
import type {
  PhaseChangePointsSegment,
  PhaseChangePointsValue,
} from "@/types/move";

/**
 * PCH値入力欄の編集中の1行。値・ヒット数のどちらも、まだ数値として確定していない
 * 空欄の下書き状態を表現するため number ではなく number | string を持つ
 * （DamageValueField の下書き state と同じ理由）。
 */
export interface PhaseChangePointsDraftRow {
  perHit: number | string;
  hitCount: number | string;
}

/**
 * 保存値を編集行に展開する。
 * - 未設定なら空欄1行。
 * - 単一値（number）なら、その値をヒット数欄が空欄の1行。
 * - 区切りの配列なら、各区切りをそのまま1行ずつに対応させる。
 */
export const phaseChangePointsToDraftRows = (
  value: PhaseChangePointsValue | undefined,
): PhaseChangePointsDraftRow[] => {
  if (value === undefined) {
    return [{ perHit: "", hitCount: "" }];
  }
  if (typeof value === "number") {
    return [{ perHit: value, hitCount: "" }];
  }
  return value.map((segment) => ({
    perHit: segment.perHit,
    hitCount: segment.hitCount,
  }));
};

/**
 * 編集行から保存値を組み立てる。
 * - perHit が数値として確定していない行（空欄の下書き）は無視する。
 * - 有効な行が1つも無ければ undefined（未計測）。
 * - 有効な行が1つだけで、ヒット数が未入力または1以下なら単一値（number）にする
 *   （同じ内容を「3.5」と「[{perHit:3.5,hitCount:1}]」の2通りで保存する揺れを防ぐ）。
 * - それ以外（行が複数、またはヒット数が2以上）は区切りの配列にする。
 */
export const draftRowsToPhaseChangePoints = (
  rows: PhaseChangePointsDraftRow[],
): PhaseChangePointsValue | undefined => {
  const segments: PhaseChangePointsSegment[] = rows.flatMap((row) =>
    typeof row.perHit === "number"
      ? [
          {
            perHit: row.perHit,
            hitCount: typeof row.hitCount === "number" ? row.hitCount : 1,
          },
        ]
      : [],
  );
  if (segments.length === 0) {
    return undefined;
  }
  if (segments.length === 1 && segments[0].hitCount <= 1) {
    return segments[0].perHit;
  }
  return segments;
};
```

- [ ] **Step 4: テストを実行し、成功を確認する**

Run: `bun test tests/lib/moves/phaseChangePoints.test.ts`
Expected: PASS（全テスト）

- [ ] **Step 5: コミット**

```bash
git add src/lib/moves/phaseChangePoints.ts tests/lib/moves/phaseChangePoints.test.ts
git commit -m "feat: PCH値の下書き行⇔保存値の変換関数を追加"
```

---

### Task 3: PCH値の表示フォーマッタを書く

**Files:**
- Modify: `src/lib/moves/moveFormat.ts`
- Test: `tests/lib/moves/moveFormat.test.ts`

**Interfaces:**
- Consumes: `PhaseChangePointsValue`（Task 1）。
- Produces: `formatPhaseChangePoints(value: PhaseChangePointsValue | undefined): string`（Task 4 の `damageRows.tsx` が使う）。

- [ ] **Step 1: 失敗するテストを書く**

`tests/lib/moves/moveFormat.test.ts` の import に `formatPhaseChangePoints` を追加する。

```ts
import {
  formatHitBreakdownValue,
  formatPhaseChangePoints,
  formatTotalDamage,
  formatTotalDamageNote,
} from "@/lib/moves/moveFormat";
```

ファイル末尾（`formatTotalDamageNote` の `describe` ブロックの後）に以下を追加する。

```ts
describe("formatPhaseChangePoints", () => {
  test("未計測は NO_VALUE_LABEL", () => {
    expect(formatPhaseChangePoints(undefined)).toBe("-");
  });

  test("単一値（小数）はそのまま表示する", () => {
    expect(formatPhaseChangePoints(3.5)).toBe("3.5");
  });

  test("区切りの配列は + で連結し、ヒット数1は省略する", () => {
    expect(
      formatPhaseChangePoints([
        { perHit: 5, hitCount: 1 },
        { perHit: 3.5, hitCount: 4 },
      ]),
    ).toBe("5+3.5×4");
  });

  test("全区切りがヒット数2以上なら全て×表記になる", () => {
    expect(
      formatPhaseChangePoints([
        { perHit: 5, hitCount: 2 },
        { perHit: 3.5, hitCount: 4 },
      ]),
    ).toBe("5×2+3.5×4");
  });
});
```

- [ ] **Step 2: テストを実行し、失敗を確認する**

Run: `bun test tests/lib/moves/moveFormat.test.ts`
Expected: FAIL（`formatPhaseChangePoints` が存在しない）

- [ ] **Step 3: 実装する**

`src/lib/moves/moveFormat.ts` の import に `PhaseChangePointsValue` を追加する。

```ts
import type {
  DamageValue,
  HitBreakdownEntry,
  JustInputAcceptFrames,
  Move,
  PhaseChangePointsValue,
  ResonanceFlinch,
  SpecialAttribute,
} from "@/types/move";
```

ファイル末尾（`formatHitBreakdownValue` の定義の後）に以下を追加する。

```ts
/**
 * PCH値の表示テキスト。未計測は NO_VALUE_LABEL、単一値はそのまま、区切りの配列は
 * formatHitBreakdownValue と同じ規約（hitCount>1 なら 値×hitCount、「+」連結）で表す。
 * 区切りが1ヒットのときはヒット数を省略する（例: 5+3.5×4）。
 */
export const formatPhaseChangePoints = (
  value: PhaseChangePointsValue | undefined,
): string => {
  if (value === undefined) {
    return NO_VALUE_LABEL;
  }
  if (typeof value === "number") {
    return `${value}`;
  }
  return value
    .map((segment) =>
      segment.hitCount > 1
        ? `${segment.perHit}×${segment.hitCount}`
        : `${segment.perHit}`,
    )
    .join("+");
};
```

- [ ] **Step 4: テストを実行し、成功を確認する**

Run: `bun test tests/lib/moves/moveFormat.test.ts`
Expected: PASS（全テスト）

- [ ] **Step 5: コミット**

```bash
git add src/lib/moves/moveFormat.ts tests/lib/moves/moveFormat.test.ts
git commit -m "feat: PCH値の表示フォーマッタを追加"
```

---

### Task 4: 技詳細ページの PCH 行を専用フォーマッタに差し替える

`damageRows.tsx` は現在、ダメージ系3項目と PCH値をまとめて `formatDamageValue` で表示している。PCH値の型がダメージ系（`DamageValue`）と分岐したため（区切りの配列 `PhaseChangePointsSegment[]` はダメージ系の `{perHit,hitCount}` 単発オブジェクトと形が違う）、PCH行だけ `formatPhaseChangePoints` を使うよう分離する。

**Files:**
- Modify: `src/components/moveDetail/damageRows.tsx`
- Test: `tests/components/moveDetail/damageRows.test.ts`（既存、変更なしで通ることを確認）

**Interfaces:**
- Consumes: `formatPhaseChangePoints`（Task 3）、`HIT_BREAKDOWN_DAMAGE_KEYS` / `HitBreakdownDamageKey`（既存、`src/lib/moves/moveEnums.ts`）。
- Produces: `DAMAGE_ROWS`（既存のエクスポート名を維持。表示内容・行の並び順は変更しない）。

- [ ] **Step 1: 現状のテストが通ることを確認する（変更前ベースライン）**

Run: `bun test tests/components/moveDetail/damageRows.test.ts`
Expected: PASS（3件）

- [ ] **Step 2: 実装する**

`src/components/moveDetail/damageRows.tsx` を全文以下に置き換える。

```tsx
import type { ComparisonRow } from "@/components/MoveComparisonTable";
import {
  HIT_BREAKDOWN_DAMAGE_KEYS,
  HIT_BREAKDOWN_NUMERIC_KEYS,
  type HitBreakdownDamageKey,
} from "@/lib/moves/moveEnums";
import {
  formatDamageValue,
  formatHitBreakdownValue,
  formatPhaseChangePoints,
  formatTotalDamage,
} from "@/lib/moves/moveFormat";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { hitBreakdownDefines } from "@/lib/moves/moveRules";
import type { Move } from "@/types/move";
import { ResonanceOverride } from "./rowHelpers";

/**
 * 技詳細ページ「ダメージ」表の行定義。
 * ダメージ系3項目と PCH値を扱い、ヒット内訳と単一値のどちらを表示するかもここで決める。
 * PCH値はダメージ系と型が異なる（区切りの配列を持てる）ため、行の組み立てとフォーマッタを
 * ダメージ系（buildDamageRow）と PCH（PCH_ROW）で分けている。
 */

/**
 * ダメージ系1行分のセル。ヒット内訳がそのフィールドを定義していれば内訳表示（例: 50+45×3）、
 * 無ければ従来通り技単位の単一値。共鳴上書きも同じ優先順位（内訳→単一値）で判定する。
 */
const buildDamageRow = (key: HitBreakdownDamageKey): ComparisonRow => ({
  header: MOVE_FIELD_LABELS[key],
  phaseDependentKeys: [key],
  renderCell: (move) => (
    <>
      {move.hitBreakdown !== undefined &&
      hitBreakdownDefines(move.hitBreakdown, key)
        ? formatHitBreakdownValue(move.hitBreakdown, key)
        : formatDamageValue(move[key])}
      <ResonanceOverride value={resonanceDamageText(move, key)} />
    </>
  ),
});

/** 共鳴のダメージ系1項目の表示テキスト。内訳優先、無ければ共鳴の単一値、どちらも無ければ undefined。 */
const resonanceDamageText = (
  move: Move,
  key: HitBreakdownDamageKey,
): string | undefined => {
  const resonanceHitBreakdown = move.resonance?.hitBreakdown;
  if (
    resonanceHitBreakdown !== undefined &&
    hitBreakdownDefines(resonanceHitBreakdown, key)
  ) {
    return formatHitBreakdownValue(resonanceHitBreakdown, key);
  }
  return move.resonance?.[key] !== undefined
    ? formatDamageValue(move.resonance[key])
    : undefined;
};

/** PCH値の共鳴上書きテキスト。resonanceDamageText と同じ優先順位（内訳→単一値）。 */
const resonancePchText = (move: Move): string | undefined => {
  const resonanceHitBreakdown = move.resonance?.hitBreakdown;
  if (
    resonanceHitBreakdown !== undefined &&
    hitBreakdownDefines(resonanceHitBreakdown, "phaseChangePoints")
  ) {
    return formatHitBreakdownValue(resonanceHitBreakdown, "phaseChangePoints");
  }
  return move.resonance?.phaseChangePoints !== undefined
    ? formatPhaseChangePoints(move.resonance.phaseChangePoints)
    : undefined;
};

/** PCH値の行。区切りの配列を持てる点がダメージ系と異なるため、専用フォーマッタで表示する。 */
const PCH_ROW: ComparisonRow = {
  header: MOVE_FIELD_LABELS.phaseChangePoints,
  phaseDependentKeys: ["phaseChangePoints"],
  renderCell: (move) => (
    <>
      {move.hitBreakdown !== undefined &&
      hitBreakdownDefines(move.hitBreakdown, "phaseChangePoints")
        ? formatHitBreakdownValue(move.hitBreakdown, "phaseChangePoints")
        : formatPhaseChangePoints(move.phaseChangePoints)}
      <ResonanceOverride value={resonancePchText(move)} />
    </>
  ),
};

/**
 * 技（技単位・共鳴ヒット内訳のどちらか）がダメージ表の数値フィールド
 * （baseDamage/chipDamage/guardCrushValue/phaseChangePoints）をヒット内訳で定義しているか。
 * move-detail.tsx の hasAnyDamage 判定で使う（内訳のみの技でダメージセクションが消えるのを防ぐ）。
 */
export const hasBreakdownValueInDamageSection = (move: Move): boolean =>
  HIT_BREAKDOWN_NUMERIC_KEYS.some(
    (key) =>
      hitBreakdownDefines(move.hitBreakdown, key) ||
      hitBreakdownDefines(move.resonance?.hitBreakdown, key),
  );

/**
 * 合計ダメージの行。コンボ補正で perHit×hitCount やヒット内訳の総和と一致しない
 * 多段ヒット技のための実測値（totalDamage、詳細は types/move.ts 参照）で、
 * ヒット内訳を持たないため buildDamageRow の生成対象には含めず単独で定義する。
 */
const TOTAL_DAMAGE_ROW: ComparisonRow = {
  header: MOVE_FIELD_LABELS.totalDamage,
  // 基礎ダメージも依存項目に含めるのは、合計ダメージが多段ヒットの状態でしか表示されない
  // （単発になるフェイズでは resolveMove が落とす）ため。基礎ダメージだけがフェイズで
  // 変わる技でこれを申告しないと、DP の合計ダメージが FP のセルまで結合されて伸びる。
  phaseDependentKeys: ["totalDamage", "baseDamage"],
  renderCell: (move) => (
    <>
      {formatTotalDamage(move.totalDamage)}
      <ResonanceOverride value={move.resonance?.totalDamage} />
    </>
  ),
};

/**
 * ダメージ系の行。全変種で未入力ならセクションごと表示しない（move-detail.tsx 側 hasAnyDamage 参照）。
 * 合計ダメージは基礎ダメージの直後（実測値との対比がしやすい位置）に挿入し、PCH は既存の
 * 表示順（moveEnums の HIT_BREAKDOWN_NUMERIC_KEYS で最後）に合わせて末尾に置く。
 */
export const DAMAGE_ROWS: ComparisonRow[] = [
  buildDamageRow("baseDamage"),
  TOTAL_DAMAGE_ROW,
  buildDamageRow("chipDamage"),
  buildDamageRow("guardCrushValue"),
  PCH_ROW,
];
```

- [ ] **Step 3: 既存テストが通ることを確認する**

Run: `bun test tests/components/moveDetail/damageRows.test.ts`
Expected: PASS（3件、変更前と同じ）

- [ ] **Step 4: コミット**

```bash
git add src/components/moveDetail/damageRows.tsx
git commit -m "refactor: 技詳細ページの PCH 行を専用フォーマッタに差し替える"
```

---

### Task 5: 小数対応の数値入力欄（DecimalNumberInput）を追加する

`IntegerNumberInput` は `allowDecimal={false}` 固定で小数を受け付けない。共通の非制御実装を `BaseNumberInput` に切り出し、`IntegerNumberInput`／新設の `DecimalNumberInput` はどちらも `allowDecimal` だけが異なる薄いラッパーにする。

このタスクにはコンポーネント単体テストの仕組み（Testing Library 等）がリポジトリに無いため自動テストは追加しない。`bun run typecheck` の通過と、既存の `IntegerNumberInput` の公開 props が変わらないことの確認で代替する。

**Files:**
- Create: `src/components/admin/BaseNumberInput.tsx`
- Modify: `src/components/admin/IntegerNumberInput.tsx`
- Create: `src/components/admin/DecimalNumberInput.tsx`

**Interfaces:**
- Produces: `BaseNumberInputProps`（`allowDecimal: boolean` を持つ）、`IntegerNumberInputProps = Omit<BaseNumberInputProps, "allowDecimal">`（既存と同一の形）、`DecimalNumberInputProps = Omit<BaseNumberInputProps, "allowDecimal">`。`DecimalNumberInput`（Task 6 の `PhaseChangePointsField` と Task 7 の `HitBreakdownFields` が使う）。

- [ ] **Step 1: 共通実装を切り出す**

`src/components/admin/BaseNumberInput.tsx` を新規作成する。

```tsx
import { NumberInput, type NumberInputProps } from "@mantine/core";

export interface BaseNumberInputProps {
  label: string;
  description?: string;
  placeholder?: string;
  /** 必須項目のラベルに * を付ける（表示のみで検証はスキーマ側）。 */
  withAsterisk?: boolean;
  /** 他の入力欄で設定済みなど、この欄からは入力させたくないとき true。 */
  disabled?: boolean;
  /** マウント時の初期値。未入力なら undefined。 */
  value: number | undefined;
  /** 負の値を許可するか。ガード/ヒット硬直差は true。 */
  allowNegative?: boolean;
  /** 小数を許可するか。整数専用は IntegerNumberInput、小数許可は DecimalNumberInput から渡す。 */
  allowDecimal: boolean;
  min?: number;
  max?: number;
  onChange: (value: number | undefined) => void;
  /** Mantine の Styles API 経由でラッパー要素にクラスを当てたい場合に指定（例: subgrid 整列）。 */
  classNames?: NumberInputProps["classNames"];
}

/**
 * 数値入力フィールドの共通実装。IntegerNumberInput（整数専用）と DecimalNumberInput
 * （小数許可）が allowDecimal だけを変えて使う。
 *
 * Mantine NumberInput を「非制御」で使うのが要点。制御（value を毎回親から戻す）にすると、
 * 入力途中の "" や "-" を親が数値へ丸めて押し戻し、手入力やマイナス入力が潰れる。
 * 非制御にすると入力途中の文字列は NumberInput 内部で完結し、確定した数値だけ onChange で受け取れる。
 *
 * 別の対象（技など）を選び直したときは内部状態を作り直す必要があるため、呼び出し側で
 * key（例 `${move.id}-strength`）を付けて再マウントさせること。
 */
export const BaseNumberInput = ({
  label,
  description,
  placeholder,
  withAsterisk,
  disabled,
  value,
  allowNegative = false,
  allowDecimal,
  min,
  max,
  onChange,
  classNames,
}: BaseNumberInputProps) => (
  <NumberInput
    label={label}
    description={description}
    placeholder={placeholder}
    withAsterisk={withAsterisk}
    disabled={disabled}
    allowNegative={allowNegative}
    allowDecimal={allowDecimal}
    min={min}
    max={max}
    defaultValue={value}
    onChange={(next) => onChange(typeof next === "number" ? next : undefined)}
    classNames={classNames}
  />
);
```

- [ ] **Step 2: IntegerNumberInput を BaseNumberInput のラッパーにする**

`src/components/admin/IntegerNumberInput.tsx` を全文以下に置き換える（公開している `IntegerNumberInputProps` の形・挙動は変えない）。

```tsx
import {
  BaseNumberInput,
  type BaseNumberInputProps,
} from "./BaseNumberInput";

export type IntegerNumberInputProps = Omit<BaseNumberInputProps, "allowDecimal">;

/**
 * 整数の数値入力フィールド（小数なし）。フレーム・強度・ため段階などに使う。
 * 実装は BaseNumberInput 参照。小数を許可する DecimalNumberInput とはここだけが異なる。
 * key 再マウントの契約（別の対象を選び直したら呼び出し側で key を変える）は
 * BaseNumberInput のドキュメントを参照。
 */
export const IntegerNumberInput = (props: IntegerNumberInputProps) => (
  <BaseNumberInput {...props} allowDecimal={false} />
);
```

- [ ] **Step 3: DecimalNumberInput を新設する**

`src/components/admin/DecimalNumberInput.tsx` を新規作成する。

```tsx
import {
  BaseNumberInput,
  type BaseNumberInputProps,
} from "./BaseNumberInput";

export type DecimalNumberInputProps = Omit<BaseNumberInputProps, "allowDecimal">;

/**
 * 小数を許容する数値入力フィールド。PCH値など整数に丸めたくない項目に使う。
 * 非制御・key 再マウントの契約は IntegerNumberInput と同じ（BaseNumberInput 参照）。
 */
export const DecimalNumberInput = (props: DecimalNumberInputProps) => (
  <BaseNumberInput {...props} allowDecimal={true} />
);
```

- [ ] **Step 4: 型チェックを実行する**

Run: `bun run typecheck`
Expected: この3ファイルに起因するエラーが無いこと。（Task 1〜3 は完了済みのためこの時点で解消しているはずのエラーと、Task 6・G 未着手のために残る `PhaseChangePointsField.tsx` 関連のエラーは想定内。3ファイル自体にエラーが出ていないことを確認する。）

- [ ] **Step 5: コミット**

```bash
git add src/components/admin/BaseNumberInput.tsx src/components/admin/IntegerNumberInput.tsx src/components/admin/DecimalNumberInput.tsx
git commit -m "refactor: 数値入力欄の共通実装を切り出し、小数対応の DecimalNumberInput を追加"
```

---

### Task 6: PhaseChangePointsField を複数行エディタに書き換える

現在の `PhaseChangePointsField` は `IntegerNumberInput` 1つだけの単純な入力欄。Task 2 の変換関数を使い、1〜N行の「PCH値×ヒット数」を編集できるエディタに書き換える。行の追加・削除に対応し、`disabled` はヒット内訳側で設定済みかどうかを呼び出し側（Task 7）から直接渡してもらう形に変える（`DamageValueField` と同じ prop 形）。

このタスクにもコンポーネント単体テストの仕組みが無いため自動テストは追加しない。ロジック（下書き行⇔保存値の変換）は Task 2 で既にテスト済みで、このタスクはそれを UI に配線するだけである。

**Files:**
- Modify: `src/components/admin/PhaseChangePointsField.tsx`

**Interfaces:**
- Consumes: `phaseChangePointsToDraftRows`／`draftRowsToPhaseChangePoints`（Task 2）、`DecimalNumberInput`（Task 5）、`IntegerNumberInput`（既存）。
- Produces: `PhaseChangePointsFieldProps { idPrefix: string; description?: string; unsetPlaceholder: string; disabled: boolean; value: PhaseChangePointsValue | undefined; onChange: (value: PhaseChangePointsValue | undefined) => void }`（`hitBreakdown` prop を廃止し `disabled: boolean` に変更。Task 7 の呼び出し側がこの新しい形に合わせて `disabled` を計算して渡す）。

- [ ] **Step 1: 実装する**

`src/components/admin/PhaseChangePointsField.tsx` を全文以下に置き換える。

```tsx
import { useState } from "react";
import { Button, Group, Stack, Text } from "@mantine/core";
import {
  draftRowsToPhaseChangePoints,
  phaseChangePointsToDraftRows,
  type PhaseChangePointsDraftRow,
} from "@/lib/moves/phaseChangePoints";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import type { PhaseChangePointsValue } from "@/types/move";
import { DecimalNumberInput } from "./DecimalNumberInput";
import { IntegerNumberInput } from "./IntegerNumberInput";
import { PLACEHOLDER_SET_BY_HIT_BREAKDOWN } from "./moveFieldsHelpers";

export interface PhaseChangePointsFieldProps {
  /** 入力欄の key に使う接頭辞。技単位／各条件付き差分で衝突しない値を渡す。 */
  idPrefix: string;
  description?: string;
  /** ヒット内訳で設定済みでないときの placeholder。技単位は「未計測」、差分は「変化なし」。 */
  unsetPlaceholder: string;
  /** true ならヒット内訳でこの項目が設定済み（併用不可）のため入力を無効化する。 */
  disabled: boolean;
  value: PhaseChangePointsValue | undefined;
  onChange: (value: PhaseChangePointsValue | undefined) => void;
}

/**
 * PCH値の入力欄。1〜N行の「値×ヒット数」を編集する。ヒットごとに他の性能は変わらず
 * PCH だけ違う技のために、ヒット内訳（HitBreakdownFields）とは独立に任意個の区切りを持てる。
 *
 * DamageValueField と同じ理由で、確定できない下書き行（値だけ入れてヒット数は未入力、
 * または追加直後の空行）をローカル state で保持する。呼び出し側は disabled が切り替わる
 * タイミング・対象の技を切り替えるタイミングで key を変えて再マウントさせること
 * （DamageValueField と同じ契約）。
 */
export const PhaseChangePointsField = ({
  idPrefix,
  description,
  unsetPlaceholder,
  disabled,
  value,
  onChange,
}: PhaseChangePointsFieldProps) => {
  const [rows, setRows] = useState<PhaseChangePointsDraftRow[]>(() =>
    phaseChangePointsToDraftRows(value),
  );

  const updateRows = (nextRows: PhaseChangePointsDraftRow[]) => {
    setRows(nextRows);
    onChange(draftRowsToPhaseChangePoints(nextRows));
  };

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        {MOVE_FIELD_LABELS.phaseChangePoints}
      </Text>
      {description !== undefined && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}
      {rows.map((row, index) => (
        <Group
          key={`${idPrefix}-phaseChangePoints-${index}-${rows.length}`}
          gap="xs"
          align="flex-end"
        >
          <DecimalNumberInput
            label={rows.length > 1 ? `PCH値${index + 1}` : "PCH値"}
            placeholder={
              disabled ? PLACEHOLDER_SET_BY_HIT_BREAKDOWN : unsetPlaceholder
            }
            disabled={disabled}
            min={0}
            value={typeof row.perHit === "number" ? row.perHit : undefined}
            onChange={(nextValue) =>
              updateRows(
                rows.map((r, i) =>
                  i === index ? { ...r, perHit: nextValue ?? "" } : r,
                ),
              )
            }
          />
          <IntegerNumberInput
            label="PCH値のヒット数"
            description="ヒットごとに PCH が違う場合のみ入力"
            disabled={disabled}
            min={1}
            value={typeof row.hitCount === "number" ? row.hitCount : undefined}
            onChange={(nextValue) =>
              updateRows(
                rows.map((r, i) =>
                  i === index ? { ...r, hitCount: nextValue ?? "" } : r,
                ),
              )
            }
          />
          <Button
            variant="subtle"
            color="red"
            size="compact-xs"
            disabled={disabled || rows.length <= 1}
            onClick={() => updateRows(rows.filter((_, i) => i !== index))}
          >
            削除
          </Button>
        </Group>
      ))}
      <Button
        variant="light"
        size="xs"
        disabled={disabled}
        onClick={() => updateRows([...rows, { perHit: "", hitCount: "" }])}
      >
        PCH値を追加
      </Button>
    </Stack>
  );
};
```

- [ ] **Step 2: 型チェックを実行する**

Run: `bun run typecheck`
Expected: `PhaseChangePointsField.tsx` 自体に起因するエラーが無いこと。呼び出し側（`MoveDamageFields.tsx`/`MoveOverrideFields.tsx`、まだ Task 7 未着手）は `hitBreakdown` prop を渡しており `disabled` prop が無いためエラーが出るはずだが、これは Task 7 で解消する想定内のエラー。

- [ ] **Step 3: コミット**

```bash
git add src/components/admin/PhaseChangePointsField.tsx
git commit -m "feat: PCH値の入力欄を複数行編集できるエディタに書き換える"
```

---

### Task 7: 呼び出し側を新しい PCH フィールドに合わせる

`PhaseChangePointsField` の props が `hitBreakdown` → `disabled` に変わったため（Task 6）、2つの呼び出し側（技単位・条件付き差分）を更新する。あわせて、ヒット内訳（`HitBreakdownFields`）の PCH 入力欄も `IntegerNumberInput` から `DecimalNumberInput` に切り替え、小数を入力できるようにする（Task 1 でスキーマは既に小数を許可済み）。

**Files:**
- Modify: `src/components/admin/MoveDamageFields.tsx`
- Modify: `src/components/admin/MoveOverrideFields.tsx`
- Modify: `src/components/admin/HitBreakdownFields.tsx`

**Interfaces:**
- Consumes: `PhaseChangePointsField`（Task 6、`disabled: boolean` prop）、`DecimalNumberInput`（Task 5）、`hitBreakdownDefines`（既存、`src/lib/moves/moveRules.ts`）。

- [ ] **Step 1: MoveDamageFields.tsx を更新する**

`src/components/admin/MoveDamageFields.tsx` 内の以下の箇所を置き換える。

変更前:
```tsx
    <PhaseChangePointsField
      idPrefix={move.id}
      description="フェイズチェンジポイント"
      unsetPlaceholder={PLACEHOLDER_NOT_MEASURED}
      hitBreakdown={move.hitBreakdown}
      value={move.phaseChangePoints}
      onChange={(value) =>
        onChange(setOptionalMoveField(move, "phaseChangePoints", value))
      }
    />
```

変更後:
```tsx
    <PhaseChangePointsField
      key={`${move.id}-phaseChangePoints-${hitBreakdownDefines(move.hitBreakdown, "phaseChangePoints")}`}
      idPrefix={move.id}
      description="フェイズチェンジポイント"
      unsetPlaceholder={PLACEHOLDER_NOT_MEASURED}
      disabled={hitBreakdownDefines(move.hitBreakdown, "phaseChangePoints")}
      value={move.phaseChangePoints}
      onChange={(value) =>
        onChange(setOptionalMoveField(move, "phaseChangePoints", value))
      }
    />
```

（`hitBreakdownDefines` はこのファイルで既に import 済み。新規 import は不要。）

- [ ] **Step 2: MoveOverrideFields.tsx を更新する**

`src/components/admin/MoveOverrideFields.tsx` の `OverrideDamageFields` 内、以下の箇所を置き換える。

変更前:
```tsx
      <PhaseChangePointsField
        idPrefix={idPrefix}
        unsetPlaceholder={PLACEHOLDER_UNCHANGED}
        hitBreakdown={value?.hitBreakdown}
        value={value?.phaseChangePoints}
        onChange={(nextValue) => onFieldChange("phaseChangePoints", nextValue)}
      />
```

変更後:
```tsx
      <PhaseChangePointsField
        key={`${idPrefix}-phaseChangePoints-${hitBreakdownDefines(value?.hitBreakdown, "phaseChangePoints")}`}
        idPrefix={idPrefix}
        unsetPlaceholder={PLACEHOLDER_UNCHANGED}
        disabled={hitBreakdownDefines(value?.hitBreakdown, "phaseChangePoints")}
        value={value?.phaseChangePoints}
        onChange={(nextValue) => onFieldChange("phaseChangePoints", nextValue)}
      />
```

（`hitBreakdownDefines` はこのファイルで既に import 済み。新規 import は不要。）

- [ ] **Step 3: HitBreakdownFields.tsx の PCH 欄を小数対応にする**

`src/components/admin/HitBreakdownFields.tsx` の import を以下に変更する。

変更前:
```tsx
import { Button, Card, Group, Select, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import {
  AIR_GROUND_JUDGMENTS,
  GUARD_LEVELS,
  HIT_BREAKDOWN_NUMERIC_KEYS,
  RESONANCE_FLINCH_LEVELS,
} from "@/lib/moves/moveEnums";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { HitBreakdownEntry } from "@/types/move";
import { IntegerNumberInput } from "./IntegerNumberInput";
```

変更後:
```tsx
import { Button, Card, Group, Select, SimpleGrid, Stack, Switch, Text } from "@mantine/core";
import {
  AIR_GROUND_JUDGMENTS,
  GUARD_LEVELS,
  HIT_BREAKDOWN_DAMAGE_KEYS,
  RESONANCE_FLINCH_LEVELS,
} from "@/lib/moves/moveEnums";
import { MOVE_FIELD_LABELS } from "@/lib/moves/moveLabels";
import { asOptionalEnumValue } from "@/lib/optionGuards";
import type { HitBreakdownEntry } from "@/types/move";
import { DecimalNumberInput } from "./DecimalNumberInput";
import { IntegerNumberInput } from "./IntegerNumberInput";
```

次に、以下のコメント＋定数を置き換える。

変更前:
```tsx
/**
 * グループごとに入力する数値項目。技単位の入力欄（MoveDamageFields）と同じラベルを使う。
 * 内訳では PCH値もダメージ系と同じ「1ヒットあたりの整数」なので同じ入力欄で扱える。
 */
const HIT_BREAKDOWN_NUMERIC_FIELDS = HIT_BREAKDOWN_NUMERIC_KEYS.map((key) => ({
  key,
  label: MOVE_FIELD_LABELS[key],
}));
```

変更後:
```tsx
/**
 * グループごとに入力するダメージ系の数値項目。技単位の入力欄（MoveDamageFields）と同じラベルを使う。
 * PCH値だけ小数を許すため（DecimalNumberInput）、この一覧には含めず別に描画する。
 */
const HIT_BREAKDOWN_DAMAGE_FIELDS = HIT_BREAKDOWN_DAMAGE_KEYS.map((key) => ({
  key,
  label: MOVE_FIELD_LABELS[key],
}));
```

最後に、グループ内の入力欄一覧を置き換える。

変更前:
```tsx
                  {HIT_BREAKDOWN_NUMERIC_FIELDS.map(({ key, label }) => (
                    <IntegerNumberInput
                      key={key}
                      label={label}
                      placeholder={PLACEHOLDER_NO_VALUE}
                      min={0}
                      value={entry[key]}
                      onChange={(value) =>
                        onChange(
                          setHitBreakdownEntryField(entries, index, key, value),
                        )
                      }
                    />
                  ))}
```

変更後:
```tsx
                  {HIT_BREAKDOWN_DAMAGE_FIELDS.map(({ key, label }) => (
                    <IntegerNumberInput
                      key={key}
                      label={label}
                      placeholder={PLACEHOLDER_NO_VALUE}
                      min={0}
                      value={entry[key]}
                      onChange={(value) =>
                        onChange(
                          setHitBreakdownEntryField(entries, index, key, value),
                        )
                      }
                    />
                  ))}
                  <DecimalNumberInput
                    label={MOVE_FIELD_LABELS.phaseChangePoints}
                    placeholder={PLACEHOLDER_NO_VALUE}
                    min={0}
                    value={entry.phaseChangePoints}
                    onChange={(value) =>
                      onChange(
                        setHitBreakdownEntryField(
                          entries,
                          index,
                          "phaseChangePoints",
                          value,
                        ),
                      )
                    }
                  />
```

- [ ] **Step 4: 型チェックとテスト全体を実行する**

Run: `bun run typecheck`
Expected: エラー無し（Task 1〜7 の全変更が揃い、型不整合が解消されている）

Run: `bun test`
Expected: 全テスト PASS

- [ ] **Step 5: コミット**

```bash
git add src/components/admin/MoveDamageFields.tsx src/components/admin/MoveOverrideFields.tsx src/components/admin/HitBreakdownFields.tsx
git commit -m "feat: PCH値入力欄の呼び出し側を更新し、ヒット内訳の PCH 欄を小数対応にする"
```

---

### Task 8: 最終確認

**Files:** なし（確認のみ）

- [ ] **Step 1: 型チェックを実行する**

Run: `bun run typecheck`
Expected: エラー無し

- [ ] **Step 2: テストスイート全体を実行する**

Run: `bun test`
Expected: 全テスト PASS

- [ ] **Step 3: 開発サーバーで実際に動作確認する**

Run: `bun run dev`

管理画面で以下を確認する。
- 既存技の PCH 値欄（技単位・共鳴/ジャスト入力/フィールドフェイズの各差分パネル）に小数（例: `3.5`）を入力して保存できること。
- 「PCH値を追加」ボタンで2行目以降を追加でき、各行に別々の値×ヒット数（例: `5`×`1` と `3.5`×`4`）を入力して保存できること。
- 保存後、技詳細ページの PCH値行が `5+3.5×4` のように表示されること。
- ヒット内訳（「ヒットごとに性能が変わる」）を ON にした技では、PCH値欄（技単位・上書き層どちらも）が「ヒット内訳で設定済み」表示で無効化されること。
- ヒット内訳のグループ内 PCH値欄に小数を入力して保存できること。

- [ ] **Step 4: 最終コミット（必要な場合のみ）**

Step 3 で修正が発生した場合のみ、変更内容に応じたコミットメッセージでコミットする。修正が無ければこのステップは不要。
