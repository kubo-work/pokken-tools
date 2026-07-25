import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

/**
 * ルート構成（設定ベース）。
 * - public: SiteHeader/Footer を持つレイアウトルート配下に公開ページを配置
 * - auth: サインイン画面 + OAuth 開始/コールバック + サインアウト（後者3つは resource route）
 * - admin: 認証保護レイアウト配下に管理ページ。api/admin は resource route
 */
export default [
  layout("routes/public/layout.tsx", [
    index("routes/public/home.tsx"),
    route("disclaimer", "routes/public/disclaimer.tsx"),
    route("punish", "routes/public/punish.tsx"),
    route("characters/:id", "routes/public/character.tsx"),
    route(
      "characters/:id/moves/:moveId",
      "routes/public/move-detail.tsx",
    ),
    route("characters/:id/punish", "routes/public/character-punish.tsx"),
  ]),

  route("auth/signin", "routes/auth/signin.tsx"),
  route("auth/google", "routes/auth/google.ts"),
  route("auth/google/callback", "routes/auth/google-callback.ts"),
  route("auth/signout", "routes/auth/signout.ts"),

  layout("routes/admin/layout.tsx", [
    ...prefix("admin", [
      index("routes/admin/home.tsx"),
      route("exceptions", "routes/admin/exceptions.tsx"),
      route("allowed-emails", "routes/admin/allowed-emails.tsx"),
      route("characters/:id", "routes/admin/character.tsx"),
    ]),
  ]),

  ...prefix("api/admin", [
    route("allowed-emails", "routes/api/allowed-emails.ts"),
    route("exceptions", "routes/api/exceptions.ts"),
    route("characters/:id", "routes/api/character.ts"),
  ]),
] satisfies RouteConfig;
