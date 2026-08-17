import type { SessionUser } from "@/auth/session.server";

/**
 * KV のエッジキャッシュ設定。
 *
 * このモジュールはサーバ専用の import を持たない（admin の UI からも秒数を参照するため）。
 * リクエストごとの適用は publicCacheTtl.server.ts と cacheTtlStorage.ts が担う。
 */

/**
 * 公開ページの KV 読み取りに指定するエッジキャッシュ秒数。
 *
 * 公開ページは 1 表示あたり最大 24 回（キャラ 23 + 例外）KV を読むため、キャッシュを効かせて
 * 表示レイテンシを下げる。KV の課金はキャッシュヒットでも読み取り操作として計上されるので、
 * ここで削減できるのはコストではなくレイテンシである点に注意。
 *
 * 秒数はフレームデータの更新頻度（調整パッチ時程度）と反映ラグの許容度から 600 秒とした。
 * 伸ばすほどキャッシュヒット率は上がるが、一般ユーザーに更新が見えるまでの時間も伸びる。
 */
export const PUBLIC_KV_CACHE_TTL_SECONDS = 600;

const SECONDS_PER_MINUTE = 60;

/**
 * 上記を分に直した値。管理画面の「反映まで最大 N 分」という注記に使う。
 * 秒数を変えたときに文言だけ古くなる事故を防ぐため、リテラルを二重に置かず導出する。
 */
export const PUBLIC_KV_CACHE_TTL_MINUTES = Math.ceil(
  PUBLIC_KV_CACHE_TTL_SECONDS / SECONDS_PER_MINUTE,
);

/**
 * KV 読み取り関数の共通オプション。
 * 省略時はリクエストスコープの既定値（cacheTtlStorage）にフォールバックする。
 */
export interface KvReadOptions {
  cacheTtlSeconds?: number;
}

/**
 * セッションから KV の cacheTtl を決める。
 *
 * 管理者には cacheTtl を付けない（＝ KV 既定の挙動）。保存直後に公開ページを開いても
 * エッジキャッシュに阻まれず反映を確認できるようにするため。KV の cacheTtl は書き込み側から
 * パージできないので、「キャッシュに載せない」以外に即時反映を担保する手段がない。
 * ただし cacheTtl 未指定でも KV 既定の 60 秒キャッシュは効くため、厳密な最新読み取りではない。
 */
export const resolveKvCacheTtlSeconds = (
  sessionUser: SessionUser | null,
): number | undefined =>
  sessionUser === null ? PUBLIC_KV_CACHE_TTL_SECONDS : undefined;
