-- allowed_emails: 管理画面に入れるメールアドレスのallowlist。
-- Auth.js の signIn コールバックで参照される。空だと誰もログインできない。
CREATE TABLE IF NOT EXISTS allowed_emails (
  email TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
