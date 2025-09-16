# Asset Simulator - Architecture Documentation

このディレクトリには、Asset Simulatorプロジェクトのアーキテクチャ図とシステム設計ドキュメントが含まれています。

## 📊 図表一覧

### 1. コンポーネント・エンティティ図 (Component Entity Diagram)
- **ファイル**: `component_entity_diagram.puml` / `component_entity_diagram.svg`
- **内容**: システム全体のコンポーネント構成とデータエンティティの関係
- **含まれる要素**:
  - データモデル（Account, CreditCard, JournalEntry等）
  - Reactコンポーネント（AccountManager, Dashboard等）
  - 状態管理（Zustand Store）
  - APIサーバー（Hono Routes）
  - データベース（Supabase PostgreSQL）

### 2. システムアーキテクチャ図 (System Architecture)
- **ファイル**: `system_architecture.puml` / `system_architecture.svg`
- **内容**: 階層化されたシステムアーキテクチャの概要
- **含まれる要素**:
  - フロントエンド層（React + TypeScript）
  - 状態管理層（Zustand）
  - 共有パッケージ（@asset-simulator/shared）
  - API層（Hono + Cloudflare Workers）
  - データベース層（Supabase PostgreSQL）
  - 外部サービス（Cloudflare Workers, Supabase Cloud）

### 3. データベースER図 (Database Entity Relationship)
- **ファイル**: `database_er_diagram.puml` / `database_er_diagram.svg`
- **内容**: データベースのテーブル構造と関係性
- **含まれるテーブル**:
  - `users` - ユーザー管理
  - `accounts` - 金融口座
  - `credit_cards` - クレジットカード
  - `journal_accounts` - 勘定科目
  - `journal_entries` - 仕訳エントリ
  - `regular_journal_entries` - 定期取引

## 🏗️ アーキテクチャの特徴

### フロントエンド
- **フレームワーク**: React 18 + TypeScript
- **スタイリング**: Bootstrap CSS
- **状態管理**: Zustand
- **コンポーネント設計**: 機能ごとのモジュール化

### バックエンド
- **フレームワーク**: Hono（軽量・高速なWebフレームワーク）
- **実行環境**: Cloudflare Workers（エッジコンピューティング）
- **API設計**: RESTful API
- **認証・認可**: Supabase Auth + Row Level Security

### データベース
- **DBMS**: PostgreSQL（Supabase）
- **設計**: 複式簿記に基づく正規化設計
- **セキュリティ**: Row Level Security（RLS）によるマルチテナント対応
- **パフォーマンス**: インデックス最適化、適切な外部キー制約

### デプロイメント
- **フロントエンド**: 静的サイトホスティング
- **バックエンド**: Cloudflare Workers（グローバル配信）
- **データベース**: Supabase Cloud（フルマネージド）

## 🔄 データフロー

1. **ユーザー操作** → Reactコンポーネント
2. **状態更新** → Zustand Store
3. **API呼び出し** → Hono API Server（Cloudflare Workers）
4. **データ操作** → Supabase PostgreSQL
5. **レスポンス** → クライアントへの結果返却

## 🛡️ セキュリティ

- **認証**: Supabase Auth
- **認可**: Row Level Security（RLS）
- **データ保護**: HTTPS通信、環境変数による秘匿情報管理
- **CORS**: 適切なオリジン制御

## 📈 スケーラビリティ

- **フロントエンド**: CDN配信、コード分割
- **バックエンド**: Cloudflare Workersによる自動スケーリング
- **データベース**: Supabaseによる読み取りレプリカ、接続プーリング

## 🔧 開発・保守性

- **型安全性**: TypeScript による型チェック
- **コード再利用**: 共有パッケージによる型・ロジック共有
- **テスト**: Jest によるユニットテスト
- **CI/CD**: 自動デプロイメント

## 📝 図の更新方法

PlantUMLファイルを編集後、以下のコマンドでSVGを再生成：

```bash
cd docs
java -jar plantuml.jar -tsvg *.puml
```

## 🎯 今後の拡張予定

- リアルタイム更新（Supabase Realtime）
- モバイルアプリ（React Native）
- レポート機能の強化
- 多通貨対応
- 予算管理機能