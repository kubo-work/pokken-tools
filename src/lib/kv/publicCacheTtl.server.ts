import { SESSION_COOKIE_NAME } from "@/auth/authConstants";
import { getSessionUser } from "@/auth/session.server";
import {
  PUBLIC_KV_CACHE_TTL_SECONDS,
  resolveKvCacheTtlSeconds,
} from "./cacheTtl";
import { publicKvCacheTtlStorage } from "./cacheTtlStorage";

/** セッション Cookie が付いているか。値だけの一致で誤判定しないよう `名前=` で判定する。 */
const hasSessionCookie = (request: Request): boolean =>
  request.headers.get("Cookie")?.includes(`${SESSION_COOKIE_NAME}=`) === true;

/**
 * リクエストの主体に応じた cacheTtl を返す。
 *
 * セッション Cookie が無いリクエスト（＝大半の一般ユーザー）はセッション読み取り自体を行わない。
 * 公開ページが AUTH_SECRET へ依存しないままでいられるようにするための早期リターンである。
 */
const getPublicKvCacheTtlSeconds = async (
  request: Request,
): Promise<number | undefined> => {
  if (!hasSessionCookie(request)) {
    return PUBLIC_KV_CACHE_TTL_SECONDS;
  }
  return resolveKvCacheTtlSeconds(await getSessionUser(request));
};

/**
 * 公開ページのレイアウトに置く middleware。配下の loader の KV 読み取りに cacheTtl を効かせる。
 *
 * 管理者のリクエストでは store を張らず、KV 既定の挙動のまま読ませる（保存直後の内容を
 * 公開ページでそのまま確認できるようにするため）。
 *
 * 注意: この middleware の配下では応答内容が Cookie によって変わる。ページ単位の CDN キャッシュを
 * 導入する場合は Vary の扱いを検討すること。
 */
export const withPublicKvCacheTtl = async (
  { request }: { request: Request },
  next: () => Promise<Response>,
): Promise<Response> => {
  const cacheTtlSeconds = await getPublicKvCacheTtlSeconds(request);
  if (cacheTtlSeconds === undefined) {
    return next();
  }
  return publicKvCacheTtlStorage.run(cacheTtlSeconds, next);
};
