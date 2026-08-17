const pad2 = (value: number): string => String(value).padStart(2, "0");

/** 一括エクスポートのダウンロードファイル名を作る。ローカルタイムゾーンで表示する。 */
export const buildBundleFileName = (exportedAt: string): string => {
  const date = new Date(exportedAt);
  const stamp =
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `-${pad2(date.getHours())}${pad2(date.getMinutes())}`;
  return `pokken-characters-${stamp}.json`;
};
