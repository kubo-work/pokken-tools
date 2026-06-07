export { auth as default } from "@/lib/auth/config";

/**
 * /admin/* と /api/admin/* を保護する。
 * 保護ロジックは auth config の authorized コールバックに置いている
 * （lazy init では auth が async になり wrapper 形式が使えないため）。
 */
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
