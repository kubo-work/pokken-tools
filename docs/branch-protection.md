# main ブランチ保護（Required status checks）

`security-scan.yml` の `semgrep` / `gitleaks` ジョブを **main へのマージ必須条件**にするための設定メモ。
これを有効にすると、両チェックが緑にならない限り main へマージできなくなり、
`--no-verify` でローカルのフックを抜けても CI で確実に止められる。

## 現状の制約

このリポジトリは **private かつ GitHub Free プラン**のため、
classic branch protection・rulesets のいずれも API/UI から有効化できない（HTTP 403）。

```
Upgrade to GitHub Pro or make this repository public to enable this feature.
```

有効化するには次のいずれかが必要:

- GitHub Pro 等の有料プランにアップグレード（private のまま解放）
- リポジトリを public にする（非推奨）

それまでは「pre-commit（ローカル）＋ CI が赤くなる＋ CLAUDE.md の運用ルール」による
ソフト運用で代替する（赤いままマージできてしまう点だけが未強制）。

## 解放後に実行するコマンド

プラン解放後、以下を一度実行すれば設定完了（要 ADMIN 権限）。
チェック名 `semgrep` / `gitleaks` は `security-scan.yml` のジョブ名と一致している。

```bash
gh api -X POST repos/kubo-work/pokken-tools/rulesets --input - <<'JSON'
{
  "name": "main security checks",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] }
  },
  "rules": [
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [
          { "context": "semgrep" },
          { "context": "gitleaks" }
        ]
      }
    }
  ]
}
JSON
```

補足:

- `strict_required_status_checks_policy: true` にすると「main 最新に追従済みでないとマージ不可」になる
  （チェックが最新状態で走る保証 ↔ 毎回 update のひと手間）。厳格にしたい場合のみ。
- `bypass_actors` を指定していないため、管理者を含め誰もバイパスできない
  （CLAUDE.md の「ルール回避禁止」方針と一貫）。
- 設定後に確認: `gh api repos/kubo-work/pokken-tools/rulesets`
