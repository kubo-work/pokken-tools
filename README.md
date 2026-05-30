# ポッ拳フレーム表

ポッ拳DXのキャラ別フレームデータと確定反撃検索を提供する Next.js アプリ。

> **これは個人が学習目的で作成した非公式のファンプロジェクトです。**
> 株式会社ポケモン、任天堂株式会社、株式会社バンダイナムコエンターテインメント
> およびその他の権利者とは一切関係ありません。本リポジトリの内容は
> 公式の見解・データを表すものではありません。

## 構成

- **Next.js 16 (App Router) + React 19 + React Compiler**
- **Cloudflare Workers** + `@opennextjs/cloudflare` でデプロイ
- **Cloudflare KV**: 技データ・例外データを格納（SSR で都度読み込み）
- **Cloudflare D1**: 管理画面アクセス許可メールアドレスを格納
- **Auth.js v5 + Google OAuth**: `/admin/*` を保護。JWT セッション戦略
- **Mantine UI**: 管理画面のみ（公開ページは独自軽量 CSS）

### ディレクトリ

```
pokken/
├── data/                          # KV seed 用の JSON
│   ├── characters/*.json          # 23キャラ分
│   └── exceptions.json
├── migrations/                    # D1 マイグレーション
├── scripts/                       # seed スクリプト群
└── src/
    ├── app/
    │   ├── layout.tsx             # 最小ルート (html/body)
    │   ├── (public)/              # 公開ページのレイアウト・ルート
    │   ├── admin/                 # 管理画面（middleware で保護）
    │   ├── auth/signin/           # ログインページ
    │   └── api/                   # API ルート
    ├── components/                # 公開ページ用コンポーネント
    │   └── admin/                 # 管理画面用 (Mantine)
    ├── lib/
    │   ├── frame/calcPunish.ts    # 確定反撃ロジック
    │   ├── kv/                    # KV アクセス
    │   ├── d1/                    # D1 アクセス
    │   ├── auth/config.ts         # Auth.js 設定
    │   ├── characters/registry.ts # 23キャラ固定レジストリ
    │   ├── meta.ts                # 表示用メタ
    │   ├── schema.ts              # Zod バリデーション
    │   └── factory.ts
    ├── types/                     # 型定義
    └── middleware.ts              # /admin/* 保護
```

## 初回セットアップ

### 0. 前提

パッケージマネージャ / ランタイムに [bun](https://bun.sh/)（`packageManager` で `bun@1.2.15` を指定）を使う。

### 1. 依存インストール

```bash
bun install
```

### 2. Cloudflare リソース作成

`wrangler` で KV namespace と D1 database を作る。出力された ID を `wrangler.toml` に貼る。

```bash
# KV
bunx wrangler kv namespace create FRAME_DATA_KV
# → wrangler.toml の [[kv_namespaces]] の id を書き換える

# D1
bunx wrangler d1 create pokken-db
# → wrangler.toml の [[d1_databases]] の database_id を書き換える
```

### 3. D1 マイグレーション適用

```bash
# ローカル開発用
bun run db:migrate:local

# 本番デプロイ前に
bun run db:migrate:remote
```

### 4. allowlist seed（自分のメールを登録）

`scripts/seed-allowlist.example.sql` をコピーして `scripts/seed-allowlist.local.sql` を作成し、自分のメールアドレスを書き込む。`.local.sql` は `.gitignore` 対象。

```bash
cp scripts/seed-allowlist.example.sql scripts/seed-allowlist.local.sql
# scripts/seed-allowlist.local.sql を編集して自分のメールに置き換える

bun run db:seed:local
bun run db:seed:remote
```

空のままだと誰もログインできず管理画面に永久に入れなくなるので必須。

### 5. KV seed（キャラ・例外データ投入）

```bash
bun run kv:seed:local
bun run kv:seed:remote
```

### 6. Google OAuth クライアント作成

[Google Cloud Console](https://console.cloud.google.com/) で OAuth 2.0 クライアントIDを作成し、以下の Redirect URI を登録:

- `http://localhost:3000/api/auth/callback/google` （開発用）
- `https://<本番ドメイン>/api/auth/callback/google` （本番用）

### 7. ローカル環境変数

```bash
cp .dev.vars.example .dev.vars
# AUTH_SECRET = openssl rand -base64 32 の出力
# AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET = OAuth クライアントの値
```

### 8. 本番シークレット

```bash
bunx wrangler secret put AUTH_SECRET
bunx wrangler secret put AUTH_GOOGLE_ID
bunx wrangler secret put AUTH_GOOGLE_SECRET
```

## 開発

```bash
bun run dev
```

[http://localhost:3000](http://localhost:3000) で起動。`next dev` 経由でローカル KV/D1 (Miniflare) に接続される。

### 本番ビルド動作確認

```bash
bun run preview
```

OpenNext でビルドして `wrangler dev` で起動する。デプロイ前の最終確認用。

## デプロイ

```bash
bun run deploy
```

## 主要 URL

| URL | 用途 | 認証 |
|---|---|---|
| `/` | キャラアイコン選択 | 不要 |
| `/characters/{id}` | 技一覧 | 不要 |
| `/characters/{id}/punish` | キャラ別 確定反撃検索 | 不要 |
| `/punish` | グローバル 確定反撃検索 | 不要 |
| `/admin` | キャラ編集一覧 | 必要 |
| `/admin/characters/{id}` | キャラの技編集 | 必要 |
| `/admin/exceptions` | 例外編集 | 必要 |
| `/admin/allowed-emails` | アクセス許可メール管理 | 必要 |
| `/auth/signin` | ログイン | 不要 |

## データモデル

- 技は **FP**（フィールド）/ **DP**（デュエル）で完全分離（`fieldMoves` / `duelMoves`）
- 共鳴状態は別技ではなく `resonance` 差分で表現。共鳴専用技は `resonanceOnly: true`
- 確定反撃の例外（ノックバック・先端当て）は登録ペアのみ。`action` 既定は `"exclude"`

## キャラの追加・削除について

23キャラ固定の前提で組まれており、`src/lib/characters/registry.ts` で一元管理。追加する場合は:

1. `registry.ts` にエントリ追加
2. `data/characters/{id}.json` を作成（空でも可）
3. KV へ投入: `bun run kv:seed:remote`

## トラブルシュート

- **管理画面に入れない**: D1 の `allowed_emails` に自分のメールが登録されているか `bunx wrangler d1 execute DB --remote --command "SELECT * FROM allowed_emails"` で確認
- **OAuth リダイレクトエラー**: Google Cloud Console の Authorized redirect URIs が本番ドメインを含んでいるか確認
- **ローカルD1の中身が消えた**: `.wrangler/state` を消したか確認。再度 `bun run db:migrate:local && bun run db:seed:local` を実行
- **KV書き込みが反映されない**: KV は最大60秒の結果整合性あり。少し待つ
