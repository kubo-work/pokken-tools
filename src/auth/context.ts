import { createContext } from "react-router";
import type { SessionUser } from "@/auth/session.server";

/**
 * admin レイアウトの middleware がセットする認証済みユーザー。
 * 配下の loader は context.get(userContext) で取得でき、セッションの二重読み取りを避けられる。
 * middleware で必ずセットされる前提のため defaultValue は与えない（未設定アクセスは throw）。
 */
export const userContext = createContext<SessionUser>();
