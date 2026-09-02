import type { Config } from "@react-router/dev/config";

export default {
  // 既定は全ページ SSR。本サイトはフレームデータを KV/D1 から loader で読むため、
  // 大半のページはリクエスト時にしか内容が確定しない。
  ssr: true,

  /**
   * ビルド時に静的 HTML を生成するルート。
   *
   * loader を持たない（＝出力がコードだけで決まる）ルートに限って列挙する。生成物は
   * build/client に出て ASSETS バインディング経由で配信されるため、Worker を起動せずに
   * エッジキャッシュから返る。Worker のレスポンスはキャッシュが Worker の背後にある都合で
   * エッジに載らないので、この2ページだけは配信経路ごと変わる。
   *
   * - "/"           : registry のキャラ名だけを並べるタイル一覧（唯一 index 許可のページ）
   * - "/disclaimer" : 免責・著作権表記。静的な文面のみ
   *
   * ここに KV を読むルートを足してはならない。ビルド時の値が焼き込まれ、管理画面の保存が
   * 再デプロイまで反映されなくなる。
   */
  prerender: ["/", "/disclaimer"],
} satisfies Config;
