/**
 * zod の検証エラー1件分の、整形に必要なだけの最小限の形（ZodIssue 互換）。
 * path の要素型は zod の ZodIssue.path（PropertyKey[] = string | number | symbol）を
 * そのまま受けられるよう合わせている。
 */
export interface FormattableIssue {
  path: PropertyKey[];
  message: string;
}

/**
 * 検証エラーの一覧を画面表示向けの一言に整形する。
 * 「path: message」を項目ごとに作り、" / " で連結する。
 * ローカルの zod 検証（useCharacterIO の JSON インポート）とサーバ応答の issues
 * （adminApiClient）はどちらもこの形なので、表示文言をここに集約する。
 */
export const formatIssues = (issues: FormattableIssue[]): string =>
  issues
    .map((issue) => `${issue.path.map(String).join(".")}: ${issue.message}`)
    .join(" / ");
