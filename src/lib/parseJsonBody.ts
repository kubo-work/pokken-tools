import type { ZodType } from "zod";

/**
 * リクエストの JSON ボディを読み取り、zod スキーマで検証して返す。
 *
 * 「JSON パース失敗 → 400」「スキーマ不一致 → 400（issues 付き）」という、API resource route で
 * 頻出する検証フローを共通化する。失敗時は 400 Response を throw する（React Router は throw された
 * Response をそのまま応答として返すため、呼び出し側は成功データだけを扱えばよい）。
 */
export const parseJsonBody = async <T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  return parsed.data;
};
