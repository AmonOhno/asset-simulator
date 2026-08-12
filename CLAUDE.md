# CLAUDE.md — Asset Simulator

## プロジェクト概要

家計・資産のシミュレーターアプリ。複式簿記の仕訳を記録し、貸借対照表・損益計算書を表示する。
Turborepo モノレポ構成。バックエンドは Supabase (PostgreSQL)。API サーバーは廃止済み（Zustand ストアで直接 RPC 呼び出し）。

同じモノレポ・同じ Supabase プロジェクト上に、エンジニア転職用のキャリア設計アプリ
`career/`（Career Compass）を持つ。ドメインは独立しており、共有するのは認証セッションと
`packages/shared` のユーティリティのみ。

## ディレクトリ構成

```
asset-simulator/
├── client/         # エントリーポイント（デバイス判定 → desktop/mobile 振り分け）
├── desktop/        # PC/タブレット版 UI (React 18 + CRA)
├── mobile/         # モバイル版コンポーネントライブラリ + アプリ (React 19 + Vite + Storybook)
│   ├── app/        # モバイルアプリ本体（Zustand 結線・認証ゲート付き）
│   ├── components/ # コンポーネントライブラリ（Storybook 対象）
│   └── src/        # Storybook エントリー用スキャフォールド
├── career/         # キャリア設計アプリ Career Compass (React 18 + Vite)
│   ├── src/lib/    # 純粋関数（年収ギャップ・スコアリング・書類生成）
│   ├── src/stores/ # careerStore（Supabase 直接アクセス）
│   └── src/components/
├── packages/
│   └── shared/     # 共有型・ユーティリティ・Zustand ストア
├── supabase/       # マイグレーション + Edge Functions（MyOS 連携 API 等）
└── docs/           # 設計ドキュメント
```

### client/ の振り分けロジック

`client/src/utils/deviceDetect.ts` でデバイスを判定し、2 つの UI に振り分ける：
- PC / タブレット (iPad 含む) → `desktop/src/App`（`@web` alias）
- スマートフォン → `mobile/app/src/App`（`@mobile` alias）

## アーキテクチャ

### State 管理（packages/shared/src/stores/）

- `financialStore.ts` — 仕訳帳・勘定科目・定期仕訳の CRUD とキャッシュ
- `eventsStore.ts` — スケジュールイベント
- `authStore.ts` — Supabase 認証セッション

**リフレッシュルール**: ミューテーション後は変更したリソースのアクションだけを呼ぶ。  
`fetchJournalAccounts()`, `fetchRegularJournalEntries()` 等を個別に呼ぶこと。  
広範囲な「全データ再取得」関数は持たない。

### shared パッケージの分離ルール

| ディレクトリ | 置くもの |
|-------------|---------|
| `types/`    | 型定義のみ（ロジックなし） |
| `utils/`    | ユーティリティ関数（`caseConvert.ts` 等） |
| `stores/`   | Zustand ストア |
| `queries/`  | Supabase から取得するだけで state を持たない読み取りクエリ（素の async 関数。ストアの `fetchXxx` アクションとは別物） |

`types/common.ts` に変換関数を追加しないこと。

### career/ の分離ルール

`career/` は資産シミュレーターとはドメインが別。共有するのは認証セッション
（`useAuthStore` / `supabase`）と `caseConvert` などのユーティリティのみで、
キャリア関連の型・ストアは `packages/shared` に置かず `career/src/` に閉じる。

| ディレクトリ | 置くもの |
|-------------|---------|
| `career/src/types/`      | 型定義のみ |
| `career/src/lib/`        | 純粋関数（DB・React・`new Date()` に依存しない。基準日は引数で受ける） |
| `career/src/stores/`     | Zustand ストア（Supabase 直接アクセス） |
| `career/src/components/` | 画面 |

スコアリングの重み・閾値はマジックナンバーを散らさず、`lib/` 内の定数に集約する。

### Supabase RPC 規則

- RPC 引数の命名規則: `p_` プレフィックス（例: `p_user_id`, `p_end_date`）
- RPC には必ず `p_user_id` を渡して DB 側でフィルタ。JS 側フィルタは使わない

### ケース変換

- DB ↔ サーバー: snake_case
- フロント: camelCase
- 変換には `packages/shared/src/utils/caseConvert.ts` の `toCamelCase` / `toSnakeCase` を使う
- `@asset-simulator/shared` からインポート可能

## ID 命名規則

| リソース | プレフィックス | 例 |
|---------|--------------|---|
| 勘定科目 | `jacc_` | `jacc_<uuid>` |
| 仕訳エントリー | `je_` | `je_<uuid>` |
| 定期仕訳 | `reg_` | `reg_<uuid>` |
| スケジュールイベント | `event_` | `event_<uuid>` |
| APIトークン | `tok_` | `tok_<uuid>` |
| 支出目標 | `goal_` | `goal_<uuid>` |
| キャリアプロフィール | `prof_` | `prof_<uuid>` |
| 保有スキル | `skill_` | `skill_<uuid>` |
| 職歴 | `exp_` | `exp_<uuid>` |
| 経験プロジェクト | `proj_` | `proj_<uuid>` |
| 学歴 | `edu_` | `edu_<uuid>` |
| 資格 | `cert_` | `cert_<uuid>` |
| 自己PR・職務要約 | `pr_` | `pr_<uuid>` |
| 希望条件 | `pref_` | `pref_<uuid>` |
| 応募 | `app_` | `app_<uuid>` |
| 生成書類 | `doc_` | `doc_<uuid>` |

## セキュリティルール

- `console.log` に環境変数の値を直接出力しない
- `environment.ts` では `value ? 'Set' : 'Not Set'` のみログ出力

## ドキュメント一覧（docs/）

索引: `docs/README.md`

| ファイル | 内容 |
|---------|------|
| `docs/architecture/overview.md` | システム概要・技術スタック・ディレクトリ構成・状態管理・shared/utils |
| `docs/ui/specification.md` | 画面構成・コンポーネント仕様・フォームバリデーション・データフロー・期間セレクター仕様 |
| `docs/api/specification.md` | Supabase 直接アクセスの規約・テーブル/VIEW/RPC 一覧・ストアアクション一覧 |
| `docs/api/myos_integration.md` | MyOS 連携用の読み取り専用 Finance API（Edge Function）仕様 |
| `docs/database/er_diagram.puml` | DB ER 図（PlantUML） |
| `docs/database/schema.md` | テーブル定義・カラム説明・VIEW・RPC |
| `docs/database/development_policy.md` | Supabase スキーマのリポジトリ管理・Docker ローカル開発・マイグレーション運用方針 |
| `docs/test/scenarios.md` | 自動テストの観点一覧・手動テストシナリオ・回帰観点 |
| `docs/career/specification.md` | Career Compass の画面構成・スコアリング算出仕様・書類生成仕様・テーブル一覧 |

## Issue駆動開発

- 開発はGitHub Issueを起点に行う
- 実装前にIssueの **Done条件** を必ず確認し、すべて満たした時点で作業完了とする
- **コードを修正する前に、最新の `main` から新しいブランチを切り出すこと。** 原因調査は現在のブランチで行ってよいが、ファイルを編集する前にブランチを作成する。マージ済みブランチや `main` の作業ツリーで直接修正を始めない。
- スコープ・カテゴリ定義・ブランチ規約は `.github/CONTRIBUTING.md` を参照
