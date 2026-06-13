import { auth } from "@/lib/auth/config";

/**
 * /admin/* と /api/admin/* を保護する。
 * 保護ロジックは auth config の authorized コールバックに置いている
 * （lazy init では auth が async になり wrapper 形式が使えないため）。
 *
 * Next.js 16 の本番ビルドは middleware の default export が関数かを静的解析するが、
 * `export { auth as default } from "..."` のクロスモジュール再エクスポートは
 * 関数として追跡できず「関数をエクスポートしていない」と誤判定する。
 * そのため auth を import し、このモジュール内でローカルに宣言した関数として
 * default export する。
 */
export default function middleware(
  ...args: Parameters<typeof auth>
): ReturnType<typeof auth> {
  return auth(...args);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
