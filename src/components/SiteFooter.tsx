import Link from "next/link";

/**
 * 公開ページ共通フッター。
 * 非公式ファンサイトである旨の短い注記と、免責・著作権表記ページへの導線を常時表示する。
 * 詳細な文面は /disclaimer 側に置き、フッターには要約のみを載せる。
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer__note">
        個人が学習目的で作成した非公式のファンサイトです。権利者とは一切関係ありません。
      </p>
      <nav className="site-footer__nav">
        <Link href="/disclaimer">免責事項・著作権表記</Link>
      </nav>
    </footer>
  );
}
