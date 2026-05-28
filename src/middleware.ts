import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

/**
 * /admin/* と /api/admin/* を保護する。
 * 未認証ユーザーは /auth/signin にリダイレクト。callbackUrl で元のURLに戻れる。
 *
 * 注意: signIn コールバックで D1 allowlist をチェックしているので、
 *      ここでは「セッションが存在するか」だけを判定すれば十分。
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isProtected) {
    return NextResponse.next();
  }
  if (req.auth !== null) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const signinUrl = new URL("/auth/signin", req.nextUrl);
  signinUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signinUrl);
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
