# システム概要・アーキテクチャ

## プロジェクト概要

家計・資産のシミュレーターアプリ。複式簿記の仕訳を記録し、貸借対照表（BS）・損益計算書（PL）を表示する。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| モノレポ管理 | Turborepo |
| Web フロントエンド | React + TypeScript |
| モバイルフロントエンド | Ionic + React |
| 状態管理 | Zustand（`@asset-simulator/shared`） |
| API サーバー | Express (Node.js) — port 3001 |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth（JWT Bearer トークン） |
| コンポーネント開発 | Storybook / Playground（`web-new/`） |

## ディレクトリ構成

```
asset-simulator/
├── web/                 # React Web アプリ
├── mobile/              # Ionic/React モバイルアプリ
├── server/              # Express API サーバー
│   └── src/
│       ├── routes/      # Express Router（リソース別ファイル分割）
│       └── middleware/  # authMiddleware 等
├── packages/
│   └── shared/          # 共有型・ユーティリティ・Zustand ストア
│       └── src/
│           ├── types/   # 型定義のみ
│           ├── utils/   # ユーティリティ関数（caseConvert.ts 等）
│           └── stores/  # Zustand ストア
├── docs/                # 設計ドキュメント（本ディレクトリ）
└── web-new/             # Storybook / Playground（開発用）
```

## 状態管理

`packages/shared/src/stores/` に Zustand ストアを集約。

| ストア | ファイル | 管理対象 |
|-------|---------|---------|
| financialStore | `financialStore.ts` | 仕訳帳・勘定科目・定期仕訳の CRUD とキャッシュ |
| eventsStore | `eventsStore.ts` | スケジュールイベント |
| authStore | `authStore.ts` | Supabase 認証セッション |

**リフレッシュルール**: ミューテーション後は変更したリソースのアクション（`getJournalAccounts()` 等）だけを個別に呼ぶ。広範囲な全データ再取得は行わない。

## API サーバー設計方針

- 全ルートに `authMiddleware` を適用（`req.user?.id` でユーザー ID を取得）
- Supabase RPC 引数には `p_` プレフィックス（例: `p_user_id`, `p_end_date`）
- RPC には必ず `p_user_id` を渡して DB 側でフィルタ（サーバー側 JS フィルタは使わない）

## ケース変換規則

| 境界 | 規則 |
|-----|------|
| DB ↔ サーバー | snake_case |
| サーバー ↔ フロントエンド | camelCase |

変換には `packages/shared/src/utils/caseConvert.ts` の `toCamelCase` / `toSnakeCase` を使用。

## ID 命名規則

| リソース | プレフィックス | 例 |
|---------|--------------|---|
| 金融口座 | `acc_` | `acc_<uuid>` |
| クレジットカード | `card_` | `card_<uuid>` |
| 勘定科目 | `jacc_` | `jacc_<uuid>` |
| 仕訳エントリー | `je_` | `je_<uuid>` |
| 定期仕訳 | `reg_` | `reg_<uuid>` |
| スケジュールイベント | `event_` | `event_<uuid>` |

## セキュリティ

- `console.log` に環境変数の値を直接出力しない
- `environment.ts` では `value ? 'Set' : 'Not Set'` のみログ出力
- 全 API エンドポイントは認証必須

## アーキテクチャ図

→ [system_architecture.puml](system_architecture.puml)（PlantUML 形式）
