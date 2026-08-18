/**
 * 管理画面のクライアントから叩く API のパス。
 *
 * app/routes.ts の `api/admin` 配下のルート定義と対になっている。各 hook に直書きすると
 * URL 変更時の追従漏れが起きるため、ここに集約して参照させる。
 */
export const ADMIN_API_ENDPOINTS = {
  allowedEmails: "/api/admin/allowed-emails",
  exceptions: "/api/admin/exceptions",
  character: (characterId: string): string =>
    `/api/admin/characters/${characterId}`,
  characterBundle: "/api/admin/characters",
} as const;
