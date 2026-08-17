const pad2 = (value: number): string => String(value).padStart(2, "0");

/**
 * 一括エクスポートのダウンロードファイル名を作る。ローカルタイムゾーンで表示する。
 * exportedAt がパース不能な場合は現在時刻にフォールバックする。ファイル名は表示用の
 * ラベルに過ぎず、本来の exportedAt は JSON 本文側に残るため、情報は失われない。
 */
export const buildBundleFileName = (exportedAt: string): string => {
  const parsedDate = new Date(exportedAt);
  const date = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const stamp =
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}` +
    `-${pad2(date.getHours())}${pad2(date.getMinutes())}`;
  return `pokken-characters-${stamp}.json`;
};
