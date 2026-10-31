# GitHub Actions（CI）

PR の作成・更新時に動くワークフローと、リポジトリ側で必要な設定をまとめる。

## ワークフロー一覧

| ファイル | ジョブ | トリガー | 内容 |
|---------|-------|---------|------|
| `.github/workflows/e2e.yml` | `Unit tests (packages/shared)` | PR（opened / synchronize / reopened / ready_for_review）、`main` への push、手動実行 | `packages/shared` の Jest ユニットテスト |
| 〃 | `E2E (Playwright)` | 同上 | `client/` をビルドし、Playwright のスモーク E2E を実行。**1 件でも失敗すればジョブ失敗** |
| `.github/workflows/claude-code-review.yml` | `review` | PR（opened / synchronize / reopened / ready_for_review）。Draft と fork からの PR は対象外 | Claude Code 公式 `code-review` プラグインで PR をレビューし、指摘を PR にコメント |

### E2E ジョブの合否判定

- `npx playwright test --retries=0` で実行する。設定ファイルでも `retries: 0` にしており、**リトライで通った flaky テストも合格扱いにしない**
- `CI=1` のとき `forbidOnly` が有効になり、`test.only` が残っていればジョブが失敗する
- 失敗時のスクリーンショット・トレース・HTML レポートは Artifact `playwright-report` に 14 日間保存される

テストの詳細（対象・モック方針・対象外にしたもの）は [test/scenarios.md の 1.3](../test/scenarios.md#13-e2e-テストplaywright) を参照。

### ローカルでの実行

```bash
npm ci
npx playwright install chromium   # 初回のみ
CI=1 npx playwright test --retries=0   # CI と同条件
npm run test:e2e                       # 開発時（起動済みの preview サーバーがあれば再利用）
```

Secrets や `.env` は不要（Supabase 通信はすべてモック）。

## 手動で行う設定

### 1. Claude Code Review 用の Secret 登録

GitHub リポジトリの **Settings → Secrets and variables → Actions → New repository secret** で、次の**どちらか一方**を登録する。

| Secret 名 | 取得方法 |
|----------|---------|
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/) で発行した API キー（従量課金） |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Pro / Max プランのユーザーがローカルで `claude setup-token` を実行して発行したトークン |

E2E ジョブは Secret を使わない。

### 2. Claude GitHub App のインストール

`anthropics/claude-code-action` が PR にコメントするために、Claude GitHub App をリポジトリにインストールする。

- https://github.com/apps/claude からインストールし、対象リポジトリ（`asset-simulator`）へのアクセスを許可する
- もしくはローカルの Claude Code で `/install-github-app` を実行すると、App のインストールと Secret 登録を対話的に行える

### 3. ブランチ保護で E2E を必須チェックにする

E2E が失敗した PR をマージできないようにする。**一度 PR 上で E2E ワークフローを実行し、チェック名が GitHub に登録されてから**設定する。

1. **Settings → Branches → Add branch ruleset**（または旧 UI の **Add classic branch protection rule**）
2. 対象ブランチに `main` を指定
3. **Require status checks to pass**（classic では *Require status checks to pass before merging*）を有効化
4. 必須チェックに次を追加
   - `E2E (Playwright)`
   - `Unit tests (packages/shared)`（推奨）
5. 必要に応じて *Require branches to be up to date before merging* も有効化
6. 保存

`Claude Code Review` は外部 API に依存し、Secret 未設定時や API 障害時に失敗し得るため、必須チェックにはしない（レビューコメントの参考扱い）。
