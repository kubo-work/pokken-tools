-- このファイルをコピーして scripts/seed-allowlist.local.sql を作成し、
-- 自分のメールアドレスに書き換えて使う。`.local.sql` は .gitignore 対象。
--
-- 用途: 初期 allowlist。空のままだと誰もログインできず admin 画面が永久にロックされるので、
--      自分のメールアドレスを最低 1 件 seed しておく。
INSERT INTO allowed_emails (email) VALUES ('your-email@example.com')
ON CONFLICT (email) DO NOTHING;
