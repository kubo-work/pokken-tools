import type { FormattableIssue } from "./formatIssues";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const characterIdAt = (raw: unknown, index: number): string | undefined => {
  if (!isRecord(raw) || !Array.isArray(raw.characters)) {
    return undefined;
  }
  const entry: unknown = raw.characters[index];
  if (!isRecord(entry) || typeof entry.id !== "string") {
    return undefined;
  }
  return entry.id;
};

/**
 * 一括バンドルの zod issues にある `characters.<index>.*` の index を、パース前の生 JSON から
 * 引いたキャラ id に置換する。「どのキャラの・どの技の・どの項目か」を画面で分かるようにするため。
 * id が取れない場合は `characters[<index>]` にフォールバックする。
 */
export const resolveBundleIssuePaths = (
  issues: FormattableIssue[],
  raw: unknown,
): FormattableIssue[] =>
  issues.map((issue) => {
    const [head, index, ...rest] = issue.path;
    if (head !== "characters" || typeof index !== "number") {
      return issue;
    }
    const id = characterIdAt(raw, index);
    const label = id ?? `characters[${index}]`;
    return { ...issue, path: [label, ...rest] };
  });
