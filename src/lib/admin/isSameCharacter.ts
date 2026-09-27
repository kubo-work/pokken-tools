import type { Character } from "@/types/character";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 値が undefined のキーは JSON に書き出されないため、比較でも「キーが無い」とみなす。 */
const definedKeys = (object: Record<string, unknown>): string[] =>
  Object.keys(object).filter((key) => object[key] !== undefined);

const isStructurallyEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((item, index) => isStructurallyEqual(item, right[index]))
    );
  }
  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = definedKeys(left);
    const rightKeys = definedKeys(right);
    return (
      leftKeys.length === rightKeys.length &&
      leftKeys.every((key) => isStructurallyEqual(left[key], right[key]))
    );
  }
  return false;
};

/**
 * 2 つの Character が保存内容として同じかを判定する（未保存の変更の有無の判定用）。
 * 参照ではなく構造で比べるので、編集して元の値に戻した場合も同一とみなす。
 * キーの順序や undefined のキーの有無は保存される JSON に影響しないため無視する。
 */
export const isSameCharacter = (left: Character, right: Character): boolean =>
  isStructurallyEqual(left, right);
