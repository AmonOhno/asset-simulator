# Asset Simulator - Docker デプロイメント

このドキュメントは、Asset SimulatorアプリケーションをDockerで実行する方法について説明します。

## 🐳 Dockerイメージの構成

### マルチステージビルド

- **base**: 基本的な設定と依存関係のインストール
- **development**: 開発/テスト環境用（ホットリロード対応）
- **builder**: ビルド専用ステージ
- **production**: 本番環境用（最適化済み）

## 🚀 クイックスタート

### 開発環境で起動

```bash
# Docker Composeを使用（推奨）
npm run docker:up:dev

# または手動でビルド＆実行
npm run docker:build:dev
npm run docker:run:dev
```

### 本番環境で起動

```bash
# Docker Composeを使用（推奨）
npm run docker:up:prod

# または手動でビルド＆実行
npm run docker:build:prod
npm run docker:run:prod
```

## 📋 利用可能なDockerコマンド

### ビルドコマンド
```bash
npm run docker:build         # デフォルトビルド（本番環境）
npm run docker:build:dev     # 開発環境用イメージをビルド
npm run docker:build:prod    # 本番環境用イメージをビルド
```

### 実行コマンド
```bash
npm run docker:run:dev       # 開発環境でコンテナを実行
npm run docker:run:prod      # 本番環境でコンテナを実行
```

### Docker Composeコマンド
```bash
npm run docker:up:dev        # 開発環境をDocker Composeで起動
npm run docker:up:prod       # 本番環境をDocker Composeで起動
npm run docker:down          # Docker Composeでサービスを停止
```

## 🔧 環境設定

### 環境変数

`.env`ファイルを作成し、必要な環境変数を設定してください：

```bash
# Supabase設定
SUPABASE_URL=https://dfqtsogrhkrayfixnbtz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXRzb2dyaGtyYXlmaXhuYnR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkzMTE2MiwiZXhwIjoyMDY4NTA3MTYyfQ.H5ufVadO5-k38NWY33WHeRYrkJmT5M5M4-FDa9lwcEo

# その他の設定
NODE_ENV=production
PORT=3001
```

### ボリュームマウント（開発環境）

開発環境では以下のディレクトリがマウントされ、ホットリロードが有効になります：
- `./apps` → `/app/apps`
- `./packages` → `/app/packages`

## 🏗️ カスタムビルド

### 手動でDockerイメージをビルド

```bash
# 開発環境用
docker build --target development -t asset-simulator:dev .

# 本番環境用
docker build --target production -t asset-simulator:prod .
```

### 手動でコンテナを実行

```bash
# 開発環境
docker run -p 3001:3001 --env-file .env asset-simulator:dev

# 本番環境
docker run -p 3001:3001 --env-file .env asset-simulator:prod
```

## 🔍 トラブルシューティング

### ポートが既に使用されている

```bash
# 使用中のポートを確認
lsof -ti:3001

# プロセスを終了
lsof -ti:3001 | xargs kill -9
```

### コンテナのログを確認

```bash
# Docker Composeの場合
docker-compose logs app-dev
docker-compose logs app-prod

# 手動実行の場合
docker logs [コンテナID]
```

### イメージの再ビルド

```bash
# キャッシュを使わずに再ビルド
docker build --no-cache --target production -t asset-simulator:prod .

# 古いイメージを削除
docker image prune -f
```

## 📊 パフォーマンス最適化

### 本番環境の特徴

- **マルチステージビルド**: 最終イメージサイズを最小化
- **セキュリティ**: 非rootユーザーでアプリケーションを実行
- **ヘルスチェック**: コンテナの正常性を監視
- **依存関係の最適化**: 本番用依存関係のみをインストール

### 推奨デプロイメント設定

```bash
# メモリ制限
docker run -m 512m asset-simulator:prod

# CPU制限
docker run --cpus="1.0" asset-simulator:prod

# 再起動ポリシー
docker run --restart=unless-stopped asset-simulator:prod
```

## 🌐 アクセス

- **Web版**: http://localhost:3001/
- **モバイル版**: http://localhost:3001/mobile/
- **API**: http://localhost:3001/api/

## 📝 注意事項

1. `.env`ファイルが正しく設定されていることを確認してください
2. Supabaseの設定が正しいことを確認してください
3. 本番環境では適切なリバースプロキシ（nginx等）の使用を推奨します
4. ログは標準出力に出力されるため、ログ収集システムとの連携を検討してください
