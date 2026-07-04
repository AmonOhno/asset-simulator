# ドキュメント索引

Asset Simulator の設計ドキュメント一覧です。API サーバー（Express）は廃止済みで、現行はフロントエンドの Zustand ストアから Supabase に直接アクセスする構成です。各ドキュメントは現行コードを確認した上で記載しています。

## アーキテクチャ設計

| ファイル | 内容 |
|---------|------|
| [architecture/overview.md](architecture/overview.md) | システム概要・技術スタック・ディレクトリ構成・状態管理・shared/utils |

## UI設計

| ファイル | 内容 |
|---------|------|
| [ui/specification.md](ui/specification.md) | 画面全体像・デスクトップ版/モバイル版のコンポーネント仕様・フォームバリデーション・データフロー・期間セレクター仕様 |

## API設計

| ファイル | 内容 |
|---------|------|
| [api/specification.md](api/specification.md) | Supabase 直接アクセスの規約・テーブル/VIEW/RPC 一覧・ストアアクション一覧・定期取引実行仕様 |

## DB・ER設計

| ファイル | 内容 |
|---------|------|
| [database/er_diagram.puml](database/er_diagram.puml) | DB ER 図（PlantUML） |
| [database/schema.md](database/schema.md) | テーブル定義・カラム説明・VIEW・RPC |

## テスト

| ファイル | 内容 |
|---------|------|
| [test/scenarios.md](test/scenarios.md) | 自動テストの観点一覧・手動テストシナリオ・回帰観点 |
