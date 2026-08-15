# ポッ拳フレーム表

ポッ拳DXのキャラ別フレームデータと確定反撃検索を提供する React Router (Vite) アプリ。

> **これは個人が学習目的で作成した非公式のファンプロジェクトです。**
> 株式会社ポケモン、任天堂株式会社、株式会社バンダイナムコエンターテインメント
> およびその他の権利者とは一切関係ありません。本リポジトリの内容は
> 公式の見解・データを表すものではありません。

## 構成

- **React Router v8 (framework mode) + React 19 + Vite**
- **Cloudflare Workers** + `@cloudflare/vite-plugin` でビルド・デプロイ
- **Cloudflare KV**: 技データ・例外データを格納（SSR の loader で都度読み込み）
- **Cloudflare D1**: 管理画面アクセス許可メールアドレスを格納
- **remix-auth + Google OAuth**: `/admin/*` を保護。署名付き Cookie セッション
- **Mantine UI**: 管理画面のみ（公開ページは独自軽量 CSS）
- **React Compiler**: `vite.config.ts` の `vite-plugin-babel` 経由で有効。手動の
  `useMemo` / `useCallback` は原則書かず、メモ化はコンパイラに任せる
- **locator.js**: 開発時のみ `@locator/babel-jsx` で JSX にソース位置を埋め込み、
  ブラウザ上の要素を Option+クリックでエディタで開ける

> Node.js は **22.22 以上**が必要（`react-router` CLI の要件。`.node-version` は 24.18.0 を指定）。
> 本番は Cloudflare Workers（workerd）で実行されるため、Node が要るのはローカル/CI のビルド時のみ。

### ディレクトリ

```
pokken/
├── data/                          # KV seed 用の JSON
│   ├── characters/*.json          # 23キャラ分
│   └── exceptions.json
├── migrations/                    # D1 マイグレーション
├── scripts/                       # seed スクリプト群 / favicon 生成
├── public/                        # 静的アセット（favicon）
├── tests/                         # テストは実装から分離し src・app の階層をミラーする
│   ├── lib/                       # src/lib 配下の対応するモジュールのテスト
│   ├── routes/api/                # API resource route の action テスト
│   └── helpers/                   # テスト共通ヘルパー（認証モック等）
├── workers/
│   └── app.ts                     # Worker エントリ（env を AsyncLocalStorage に格納）
├── app/                           # React Router (framework mode)
│   ├── root.tsx                   # ルートレイアウト (html/body/テーマ初期化)
│   ├── routes.ts                  # ルート定義（設定ベース）
│   ├── entry.server.tsx           # SSR エントリ
│   └── routes/
│       ├── public/                # 公開ページ（layout + 各ルート）
│       ├── admin/                 # 管理画面（layout の middleware で保護）
│       ├── auth/                  # ログイン / OAuth 開始・コールバック / サインアウト
│       └── api/                   # API resource route（/api/admin/*）
└── src/
    ├── auth/
    │   ├── session.server.ts      # Cookie セッション（getSessionUser / requireApiUser 等）
    │   ├── authenticator.server.ts# remix-auth の Google OAuth ストラテジー
    │   ├── context.ts             # middleware → loader へユーザーを渡す RouterContext
    │   └── authConstants.ts       # エラーコード / Cookie 名 / セッション有効期限
    ├── components/                # 公開ページ用コンポーネント
    │   ├── admin/                 # 管理画面用 (Mantine)
    │   └── moveDetail/            # 技詳細ページの行定義（責務ごとに分割）
    ├── hooks/                     # 画面状態を束ねる React フック
    │   ├── admin/                 # キャラ編集の state / 保存 / 入出力
    │   └── punish/                # 確定反撃検索の入力状態
    ├── lib/
    │   ├── moves/                 # 技ドメイン（下記「レイヤと依存の向き」を参照）
    │   ├── frame/                 # 確定反撃・硬直差の計算
    │   ├── schema/                # Zod バリデーション
    │   ├── kv/                    # KV アクセス
    │   ├── d1/                    # D1 アクセス
    │   ├── admin/                 # 管理画面共通の API クライアント / エンドポイント / 表示トークン
    │   ├── cloudflare.ts          # getEnv()（AsyncLocalStorage 経由で env 取得）
    │   ├── characters/registry.ts # 23キャラ固定レジストリ
    │   ├── parseJsonBody.ts       # API resource route 共通の JSON 検証
    │   └── characterTiles.ts      # キャラタイル集計（公開/管理トップ共通）
    ├── styles/                    # グローバル CSS（トークン→ベース→機能別で分割）
    └── types/                     # 型定義
```

### レイヤと依存の向き

import は必ず **外側 → 内側** の一方向。内側（技のドメイン）が外側（React / Mantine /
Cloudflare / 画面）を import してはならない。Next.js から React Router へ移行できたのも、
硬直差やヒット内訳の計算がフレームワークを知らなかったため。

```
app/routes/ ─→ src/components/ ─→ src/hooks/ ─→ src/lib/moves/ ─→ src/types/
                                   src/lib/kv/, src/lib/d1/ ─┘
```

`src/lib/moves/` の内部も同じ規則で分かれる。**ファイルは変更理由の単位**で切っており、
1 つの変更で複数ファイルを開くことになったら切り方が間違っているというのが判断基準。

| モジュール | 持つもの | 変更理由 |
|---|---|---|
| `moveEnums.ts` | 値の集合（`GUARD_LEVELS` 等） | ゲームに項目が増えたとき |
| `moveRules.ts` | 値に対する判断（強度範囲・ため段階・ヒット内訳の合計） | ゲーム仕様が変わったとき |
| `moveLabels.ts` | 表示文言（`*_META`, `NO_VALUE_LABEL` 等） | 文言を変えたいとき |
| `moveFormat.ts` | 値 1 つの整形（`formatDamageValue` 等） | 見せ方を変えたいとき |
| `moveCategoricalDisplay.ts` | 判定・空地・共鳴怯ませ・攻撃属性・強度の表示（内訳と技単位の代表値の解決を伴う） | 内訳の見せ方を変えたいとき |
| `moveUpdaters.ts` | 技本体のフィールド更新（不変条件の維持） | 技の持ちうる形が変わったとき |
| `moveOverrideUpdaters.ts` | 条件付き差分（共鳴・ジャスト入力）の更新 | 差分の種類が増えたとき |
| `moveHitBreakdownUpdaters.ts` | ヒット内訳の配列操作 | 内訳の構造が変わったとき |

依存は `moveCategoricalDisplay / moveFormat → moveLabels / moveRules → moveEnums`、
`moveOverrideUpdaters → moveHitBreakdownUpdaters → moveUpdaters`。いずれも一方向。

`lib` と `components` のどちらに置くかは、「React を import しているか」ではなく
「**画面が無くてもその概念は成立するか**」で判断する。

- `setMoveSpecialAttributes`（弾消しを外したら開始フレームも消す）はゲーム仕様なので `lib`
- `PLACEHOLDER_NOT_MEASURED`（"未計測"）は管理画面の入力欄固有なので `components`
- `NO_VALUE_LABEL`（"-"）は公開ページと整形関数の両方が使う表示規約なので `lib`。
  `lib` は `components` を import できないため、共有する定数はこちらに置くしかない

## 初回セットアップ

### 0. 前提

- パッケージマネージャ / ランタイムに [bun](https://bun.sh/)（`packageManager` で `bun@1.2.15` を指定）
- Node.js **22.22 以上**（`.node-version` は 24.18.0）。nodebrew 等でインストールする:
  ```bash
  nodebrew install v24.18.0 && nodebrew use v24.18.0
  ```

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

- `http://localhost:2015/auth/google/callback` （開発用）
- `https://<本番ドメイン>/auth/google/callback` （本番用）

### 7. ローカル環境変数

```bash
cp .dev.vars.example .dev.vars
# AUTH_SECRET = openssl rand -base64 32 の出力（セッション Cookie の署名に使う）
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

[http://localhost:2015](http://localhost:2015) で起動。`react-router dev`（Vite）経由でローカル KV/D1 (Miniflare) と `.dev.vars` に接続される。

### 本番ビルド動作確認

```bash
bun run preview
```

Vite でビルドして Workers ランタイム（workerd）上で起動する（`vite preview`）。デプロイ前の最終確認用。

## デプロイ

```bash
bun run deploy
```

`react-router build`（Vite）→ `wrangler deploy` の順で実行される。`wrangler` は `@cloudflare/vite-plugin` のビルド出力を自動検出して配信する。

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

- 技は **FP**（フィールド）/ **DP**（デュエル）/ **共通** の3区分（`fieldMoves` / `duelMoves` / `commonMoves`）
- 共鳴状態は別技ではなく `resonance` 差分で表現。共鳴専用技は `resonanceOnly: true`
- 確定反撃の例外（ノックバック・先端当て）は登録ペアのみ。`action` 既定は `"exclude"`

## キャラの追加・削除について

23キャラ固定の前提で組まれており、`src/lib/characters/registry.ts` で一元管理。追加する場合は:

1. `registry.ts` にエントリ追加
2. `data/characters/{id}.json` を作成（空でも可）
3. KV へ投入: `bun run kv:seed:remote`

## トラブルシュート

- **管理画面に入れない**: D1 の `allowed_emails` に自分のメールが登録されているか `bunx wrangler d1 execute DB --remote --command "SELECT * FROM allowed_emails"` で確認
- **OAuth リダイレクトエラー (`redirect_uri_mismatch`)**: Google Cloud Console の Authorized redirect URIs に `<origin>/auth/google/callback` が登録されているか確認（開発は `http://localhost:2015/auth/google/callback`）
- **ローカルD1の中身が消えた**: `.wrangler/state` を消したか確認。再度 `bun run db:migrate:local && bun run db:seed:local` を実行
- **KV書き込みが反映されない**: KV は最大60秒の結果整合性あり。少し待つ
- **`Node version ... requires > 22.22.0` の警告**: ローカル/CI の Node を 22.22 以上（推奨 24）に上げる。本番（workerd）には影響しない
