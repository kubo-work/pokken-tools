import { describe, expect, test } from "bun:test";
import { readJsonFile } from "@/lib/admin/readJsonFile";

const makeFile = (bytes: number[], name = "test.json"): File =>
  new File([new Uint8Array(bytes)], name, { type: "application/json" });

const utf8Bytes = (text: string): number[] =>
  Array.from(new TextEncoder().encode(text));

describe("readJsonFile", () => {
  test("正常な UTF-8 の JSON はパースして返す", async () => {
    const file = makeFile(utf8Bytes('{"a":1}'));
    const result = await readJsonFile(file);
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  test("BOM 付き UTF-8 でも正しく読める", async () => {
    const file = makeFile([0xef, 0xbb, 0xbf, ...utf8Bytes('{"a":1}')]);
    const result = await readJsonFile(file);
    expect(result).toEqual({ ok: true, value: { a: 1 } });
  });

  test("不正な UTF-8 バイト列はエラーになる", async () => {
    // 0x83 は UTF-8 の先頭バイトとして不正（Shift_JIS の日本語部分が壊れる想定を再現する最小データ）
    const file = makeFile([0x83, 0x65, 0x83, 0x58]);
    const result = await readJsonFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("UTF-8");
    }
  });

  test("UTF-8 として読めても JSON として不正ならパースエラーになる", async () => {
    const file = makeFile(utf8Bytes("not json"));
    const result = await readJsonFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("JSONのパースに失敗しました");
    }
  });
});
