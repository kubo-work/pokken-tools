/**
 * ファイル読み込みの結果。
 * UTF-8 でない、または JSON として不正な場合は ok: false でメッセージを返す。
 */
export type ReadJsonFileResult =
  | { ok: true; value: unknown }
  | { ok: false; message: string };

/**
 * File を UTF-8 として厳密に復号し、JSON としてパースする。
 *
 * `File.text()` は常に UTF-8 として復号し、不正なバイト列を無言で U+FFFD に置換するため、
 * Shift_JIS 等のファイルを渡しても例外にならず壊れたデータがそのまま通ってしまう。
 * ここでは `TextDecoder("utf-8", { fatal: true })` を使い、不正なバイト列を例外として検出する。
 */
export const readJsonFile = async (
  file: File
): Promise<ReadJsonFileResult> => {
  let text: string;
  try {
    const buffer = await file.arrayBuffer();
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (error) {
    console.error("file decode failed", error);
    return {
      ok: false,
      message:
        "ファイルをUTF-8として読み取れませんでした。UTF-8で保存し直してください",
    };
  }
  try {
    const value = JSON.parse(text) as unknown;
    return { ok: true, value };
  } catch (error) {
    console.error("JSON parse failed", error);
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `JSONのパースに失敗しました: ${message}` };
  }
};
