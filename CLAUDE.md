# CLAUDE.md — Asset Simulator

## プロジェクト概要

家計・資産のシミュレーターアプリ。複式簿記の仕訳を記録し、貸借対照表・損益計算書を表示する。
Turborepo モノレポ構成。バックエンドは Supabase (PostgreSQL)、サーバーは Express。

## ディレクトリ構成

```
asset-simulator/
├── web/            # React ウェブアプリ
├── mobile/         # Ionic/React ネイティブアプリ
├── server/         # Express API サーバー (port 3001)
├── packages/
│   └── shared/     # 共有型・ユーティリティ・Zustand ストア
├── docs/           # 設計ドキュメント
└── web-new/        # Storybook / Playground (開発用)
```

## よく使うコマンド

```bash
npm run dev          # サーバー + Web を同時起動
npm run dev:server   # サーバーのみ
npm run dev:web      # Web のみ
npm run build        # 全パッケージビルド
npm run playground   # Storybook / Playground 起動
npx tsc --noEmit -p packages/shared/tsconfig.json  # 型チェック（shared）
npx tsc --noEmit -p server/tsconfig.json           # 型チェック（server）
```

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

### API サーバー（server/src/）

- ルート: `server/src/routes/` — Express Router ごとにファイル分割
- 認証: `authMiddleware` を全ルートに適用（`req.user?.id` でユーザーID取得）
- Supabase RPC 引数の命名規則: `p_` プレフィックス（例: `p_user_id`, `p_end_date`）
- RPC には必ず `p_user_id` を渡してDB側でフィルタ。サーバー側JSフィルタは使わない

### ケース変換

- DB ↔ サーバー: snake_case
- フロント: camelCase
- 変換には `packages/shared/src/utils/caseConvert.ts` の `toCamelCase` / `toSnakeCase` を使う
- `@asset-simulator/shared` からインポート可能

## ID 命名規則

| リソース | プレフィックス | 例 |
|---------|--------------|---|
| 金融口座 | `acc_` | `acc_<uuid>` |
| クレジットカード | `card_` | `card_<uuid>` |
| 勘定科目 | `jacc_` | `jacc_<uuid>` |
| 仕訳エントリー | `je_` | `je_<uuid>` |
| 定期仕訳 | `reg_` | `reg_<uuid>` |
| スケジュールイベント | `event_` | `event_<uuid>` |

## セキュリティルール

- `console.log` に環境変数の値を直接出力しない
- `environment.ts` では `value ? 'Set' : 'Not Set'` のみログ出力

## ドキュメント一覧（docs/）

| ファイル | 内容 |
|---------|------|
| `API_SPECIFICATION.md` | エンドポイント仕様（リクエスト/レスポンス形式） |
| `UI_SPECIFICATION.md` | 画面構成・コンポーネント仕様・データフロー |
| `UI_FORM_VALIDATION_AND_STORAGE.md` | フォームバリデーション詳細仕様 |
| `system_architecture.puml` | システムアーキテクチャ図（PlantUML） |
| `database_er_diagram.puml` | DB ER 図（PlantUML） |
| `COMPONENT_LIST.csv` | コンポーネント一覧 |

## 対象外タスク（別タスクで対応予定）

- エラーレスポンスの統一（エラーコード導入）
- LocalStorage persist の古いデータ対策（バージョニング）
- `journalEntries` の DELETE エンドポイント
- ページネーション実装
- タイムゾーン対応
