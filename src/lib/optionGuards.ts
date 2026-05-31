/**
 * Mantine の Select / Checkbox.Group のように `string | string[] | null` で受け取る
 * onChange の値を enum リテラルへ安全に絞り込む。
 * 不正な値や null のときは fallback を返すので、`as` で広めにキャストせずに済む。
 */
export const asEnumValue = <T extends string>(
  value: string | null,
  options: readonly T[],
  fallback: T,
): T =>
  value !== null && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;

/**
 * 同様だが「未設定（undefined）」を許容するパターン。
 * 値が null / options に含まれない場合は undefined を返す。
 */
export const asOptionalEnumValue = <T extends string>(
  value: string | null,
  options: readonly T[],
): T | undefined =>
  value !== null && (options as readonly string[]).includes(value)
    ? (value as T)
    : undefined;

/**
 * undefined ではなく null を「未設定」として扱うフィールド向け。
 * 例: Move.guardLevel が `GuardLevel | null` のとき。
 */
export const asNullableEnumValue = <T extends string>(
  value: string | null,
  options: readonly T[],
): T | null =>
  value !== null && (options as readonly string[]).includes(value)
    ? (value as T)
    : null;

/**
 * Checkbox.Group の onChange (string[]) を enum リテラル配列に絞り込む。
 * options に含まれない値は捨てて元 options 並び順を維持する。
 */
export const pickEnumValues = <T extends string>(
  values: string[],
  options: readonly T[],
): T[] => options.filter((option) => values.includes(option));
