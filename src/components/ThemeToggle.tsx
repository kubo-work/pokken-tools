import { Suspense, use, useState } from "react";
import { browser } from "react-dom";
import { IconMoon, IconSun } from "@tabler/icons-react";
import {
  THEME,
  THEME_STORAGE_KEY,
  THEME_TOGGLE_LABEL,
  type Theme,
} from "@/lib/theme";

/**
 * 公開側のライト/ダーク切替ボタン。
 *
 * テーマの初期適用はルートレイアウトのインラインスクリプトが描画前に行う（data-theme 属性）。
 * このコンポーネントは「現在のテーマ表示」と「クリックでの切替・永続化」だけを担う。
 *
 * 実際のテーマは <html> の data-theme にしかなくサーバーでは読めないため、ボタン本体は
 * use(browser()) でブラウザ専用の部分木にする。SSR / プリレンダでは同サイズのプレースホルダ
 * （Suspense の fallback）を出し、hydration ミスマッチとレイアウトシフトを防ぐ。
 */
export const ThemeToggle = () => (
  <Suspense fallback={<span className="theme-toggle" aria-hidden="true" />}>
    <ThemeToggleButton />
  </Suspense>
);

const readDocumentTheme = (): Theme =>
  document.documentElement.dataset.theme === THEME.LIGHT
    ? THEME.LIGHT
    : THEME.DARK;

const ThemeToggleButton = () => {
  // サーバーではここで描画を打ち切り、最寄りの Suspense の fallback を出す。
  // ブラウザでは素通りするため、以降は document を直接読んでよい。
  use(browser());
  const [theme, setTheme] = useState<Theme>(readDocumentTheme);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  const isDark = theme === THEME.DARK;
  const toggleLabel = isDark
    ? THEME_TOGGLE_LABEL.TO_LIGHT
    : THEME_TOGGLE_LABEL.TO_DARK;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={toggleLabel}
      title={toggleLabel}
    >
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  );
};
