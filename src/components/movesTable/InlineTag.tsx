import type { ReactNode } from "react";
import { UI_SIZES } from "@/lib/uiTokens";

/**
 * 技一覧のセル内で値の右に添える小さなラベル。
 * ジャスト入力・フェイズ・共鳴専用・ため/派生・空地判定で見た目を揃えるため共通化する。
 */
export const InlineTag = ({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) => (
  <span style={{ marginLeft: 4, fontSize: UI_SIZES.caption, color }}>
    {children}
  </span>
);
