# CLAUDE.md — Asset Simulator

## プロジェクト概要

家計・資産のシミュレーターアプリ。複式簿記の仕訳を記録し、貸借対照表・損益計算書を表示する。
Turborepo モノレポ構成。バックエンドは Supabase (PostgreSQL)。API サーバーは廃止済み（Zustand ストアで直接 RPC 呼び出し）。

## ディレクトリ構成

```
asset-simulator/
├── client/         # エントリーポイント（デバイス判定 → desktop/mobile 振り分け）
├── desktop/        # PC/タブレット版 UI (React 18 + CRA)
├── mobile/         # モバイル版コンポーネントライブラリ + アプリ (React 19 + Vite + Storybook)
│   ├── src/        # コンポーネントライブラリ（Storybook 対象）
│   └── playground/ # モバイルアプリ本体
├── packages/
│   └── shared/     # 共有型・ユーティリティ・Zustand ストア
└── docs/           # 設計ドキュメント
```

### client/ の振り分けロジック

`client/src/utils/deviceDetect.ts` でデバイスを判定し、2 つの UI に振り分ける：
- PC / タブレット (iPad 含む) → `desktop/src/App`（`@web` alias）
- スマートフォン → `mobile/playground/src/App`（`@mobile` alias）

## アーキテクチャ

### State 管理（packages/shared/src/stores/）

- `financialStore.ts` — 仕訳帳・勘定科目・定期仕訳の CRUD とキャッシュ
- `eventsStore.ts` — スケジュールイベント
- `authStore.ts` — Supabase 認証セッション

**リフレッシュルール**: ミューテーション後は変更したリソースのアクションだけを呼ぶ。  
`getJournalAccounts()`, `getRegularJournalEntries()` 等を個別に呼ぶこと。  
広範囲な「全データ再取得」関数は持たない。

### shared パッケージの分離ルール

| ディレクトリ | 置くもの |
|-------------|---------|
| `types/`    | 型定義のみ（ロジックなし） |
| `utils/`    | ユーティリティ関数（`caseConvert.ts` 等） |
| `stores/`   | Zustand ストア |

`types/common.ts` に変換関数を追加しないこと。

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

## セキュリティルール

- `console.log` に環境変数の値を直接出力しない
- `environment.ts` では `value ? 'Set' : 'Not Set'` のみログ出力

## ドキュメント一覧（docs/）

索引: `docs/README.md`

| ファイル | 内容 |
|---------|------|
| `docs/architecture/overview.md` | システム概要・技術スタック・アーキテクチャ方針 |
| `docs/architecture/system_architecture.puml` | システムアーキテクチャ図（PlantUML） |
| `docs/feature/overview.md` | 機能一覧・画面遷移概要 |
| `docs/feature/journal_entry.md` | 仕訳入力機能設計 |
| `docs/feature/regular_journal.md` | 定期仕訳機能設計 |
| `docs/feature/financial_statement.md` | 財務諸表（BS/PL）表示機能設計 |
| `docs/feature/account_management.md` | 口座・勘定科目管理機能設計 |
| `docs/feature/event_schedule.md` | スケジュールイベント機能設計 |
| `docs/ui/specification.md` | 画面構成・コンポーネント仕様・データフロー |
| `docs/ui/form_validation.md` | フォームバリデーション詳細仕様 |
| `docs/ui/component_list.csv` | コンポーネント一覧 |
| `docs/ui/component_design.md` | モバイル向けコンポーネント設計（開発中） |
| `docs/api/specification.md` | エンドポイント仕様（リクエスト/レスポンス形式） |
| `docs/database/er_diagram.puml` | DB ER 図（PlantUML） |
| `docs/database/schema.md` | テーブル定義・カラム説明 |

## 対象外タスク（別タスクで対応予定）

- エラーレスポンスの統一（エラーコード導入）
- LocalStorage persist の古いデータ対策（バージョニング）
- `journalEntries` の DELETE エンドポイント
- ページネーション実装
- タイムゾーン対応
