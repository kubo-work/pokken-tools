import { mock } from "bun:test";
import { RouterContextProvider } from "react-router";
import type { SessionUser } from "@/auth/session.server";

/**
 * API resource route（app/routes/api/*）のテスト共通ヘルパー。
 *
 * Next.js の route handler 時代は関数を直接呼べば検証できたが、React Router 移行後は
 * action の先頭で requireApiUser による認証が走るため、認証を通した状態を作らないと
 * バリデーション分岐まで到達できない。ここでその差分を吸収する。
 */

/** 認証済みとして扱うダミーユーザー。「自分自身は削除できない」分岐の検証にも使う。 */
export const TEST_API_USER: SessionUser = { email: "admin@example.com" };

/**
 * requireApiUser を差し替えて認証通過済みの状態にする。
 *
 * 制約が 2 つある:
 * - static import は巻き上げられて mock 登録より先に評価されるため、これを呼んだあとに
 *   `await import(...)` でルートモジュールを動的に読み込むこと。
 * - bun の mock.module はテストプロセス全体に効く。今後 @/auth/session.server の
 *   実装そのものを検証するテストを足す場合は、このモックと同居しないよう注意する。
 */
export const mockAuthenticatedApiUser = (): void => {
  mock.module("@/auth/session.server", () => ({
    requireApiUser: async (): Promise<SessionUser> => TEST_API_USER,
  }));
};

/**
 * resource route の action が受け取る引数。React Router の ServerDataFunctionArgs と同じ形。
 * 同型は react-router/internal から公開されていないため、ここで定義して構造的に合わせる。
 */
interface ResourceRouteActionArgs<Params> {
  request: Request;
  url: URL;
  params: Params;
  /** 未補間のルートパターン（例: /api/admin/characters/:id）。ログ用途で action は参照しない。 */
  pattern: string;
  context: Readonly<RouterContextProvider>;
}

/**
 * resource route の action を呼び、throw された Response も戻り値として受け取る。
 * requireApiUser / parseJsonBody は失敗時に Response を throw し、React Router が
 * それをそのまま応答として返すため、テスト側でも同じ扱いに揃える。
 */
export const invokeAction = async <Params extends Record<string, string>>(
  action: (args: ResourceRouteActionArgs<Params>) => Promise<Response>,
  args: { request: Request; params?: Params; pattern?: string },
): Promise<Response> => {
  try {
    return await action({
      request: args.request,
      url: new URL(args.request.url),
      params: args.params ?? ({} as Params),
      pattern: args.pattern ?? "",
      context: new RouterContextProvider(),
    });
  } catch (thrown) {
    if (thrown instanceof Response) {
      return thrown;
    }
    throw thrown;
  }
};

/** エラー応答の error フィールドを取り出す。Response.json() の戻り値が unknown のため型を確定させる。 */
export const errorMessageOf = async (response: Response): Promise<string> => {
  const body = (await response.json()) as { error: string };
  return body.error;
};
