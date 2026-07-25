import { Link } from "react-router";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link to="/" className="site-header__brand">
        ポッ拳フレーム表
      </Link>
      <div className="site-header__actions">
        <nav className="site-header__nav">
          <Link to="/">キャラ一覧</Link>
          <Link to="/punish">確定反撃検索</Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
