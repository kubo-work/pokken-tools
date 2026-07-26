import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { THEME, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

/**
 * 公開側のライト/ダーク切替ボタン。
 *
 * テーマの初期適用はルートレイアウトのインラインスクリプトが描画前に行う（data-theme 属性）。
 * このコンポーネントは「現在のテーマ表示」と「クリックでの切替・永続化」だけを担う。
 *
 * SSR 時点では実際のテーマが未確定でサーバーとクライアントで食い違うため、
 * マウント完了までアイコンを描画せず同サイズのプレースホルダを返し、
 * hydration ミスマッチとレイアウトシフトを防ぐ。
 * この「マウント前」は theme が undefined であることで表すため、専用の state は持たない。
 */
export const ThemeToggle = () => {
  // 実際のテーマは <html> の data-theme にしかなく、hydration 後でないと読めない。
  const [theme, setTheme] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === THEME.LIGHT
        ? THEME.LIGHT
        : THEME.DARK,
    );
  }, []);

  if (theme === undefined) {
    return <span className="theme-toggle" aria-hidden="true" />;
  }

  const toggleTheme = () => {
    const nextTheme: Theme = theme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  const isDark = theme === THEME.DARK;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "ライトモードに切り替える" : "ダークモードに切り替える"}
      title={isDark ? "ライトモードに切り替える" : "ダークモードに切り替える"}
    >
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  );
};
