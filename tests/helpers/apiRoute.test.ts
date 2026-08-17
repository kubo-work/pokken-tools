import { describe, expect, test } from "bun:test";
import { mockAuthenticatedApiUser } from "./apiRoute";

mockAuthenticatedApiUser();

/**
 * mock.module はモジュールを丸ごと置き換えるため、差し替え対象以外の export を返し忘れると
 * それらを import している別テストが読み込み時に落ちる。しかも壊れるかどうかは
 * ファイルの評価順に依存し、ローカルで通っても CI で落ちるという形で表面化する。
 * 実際に一度その事故が起きたので、モックが他の export を保つことを不変条件として固定する。
 */
describe("mockAuthenticatedApiUser", () => {
  test("差し替え対象以外の export を消さない", async () => {
    const sessionServer = await import("@/auth/session.server");
    expect(typeof sessionServer.getSessionUser).toBe("function");
    expect(typeof sessionServer.createUserSession).toBe("function");
    expect(typeof sessionServer.destroyUserSession).toBe("function");
  });

  test("認証モック登録後でも session.server に依存するモジュールを読み込める", async () => {
    const publicCacheTtl = await import("@/lib/kv/publicCacheTtl.server");
    expect(typeof publicCacheTtl.withPublicKvCacheTtl).toBe("function");
  });
});
