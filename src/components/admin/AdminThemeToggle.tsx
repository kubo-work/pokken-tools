import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { THEME, THEME_TOGGLE_LABEL } from "@/lib/theme";

/**
 * admin 側のライト/ダーク切替ボタン。
 *
 * 色スキームの状態管理・localStorage への永続化・FOUC 対策は
 * Mantine（MantineProvider / ColorSchemeScript）が担うため、
 * ここでは現在のスキーム表示と切替操作だけを行う。
 */
export function AdminThemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === THEME.DARK;
  const toggleLabel = isDark
    ? THEME_TOGGLE_LABEL.TO_LIGHT
    : THEME_TOGGLE_LABEL.TO_DARK;

  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={() => setColorScheme(isDark ? THEME.LIGHT : THEME.DARK)}
      aria-label={toggleLabel}
      title={toggleLabel}
    >
      {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}
