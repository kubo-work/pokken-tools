import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__brand">
        ポッ拳フレーム表
      </Link>
      <nav className="site-header__nav">
        <Link href="/">キャラ一覧</Link>
        <Link href="/punish">確定反撃検索</Link>
      </nav>
    </header>
  );
}
