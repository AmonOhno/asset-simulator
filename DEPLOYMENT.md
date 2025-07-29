# デプロイメントガイド

## 概要
このプロジェクトは GitHub Actions と Render.com を使用して自動デプロイされます。
develop ブランチから main ブランチへのマージ時に自動的にデプロイが実行されます。

## 必要な設定

### 1. Render.com アカウント作成
1. [Render.com](https://render.com) でアカウントを作成
2. GitHubリポジトリを連携
3. 新しいWebサービスを作成

### 2. GitHub Secrets の設定
GitHub リポジトリの Settings > Secrets and variables > Actions で以下を設定：

- `RENDER_SERVICE_ID`: RenderのサービスID
- `RENDER_API_KEY`: RenderのAPIキー
- `SUPABASE_URL`: SupabaseのプロジェクトURL
- `SUPABASE_KEY`: Supabaseのサービスロールキー

### 3. Render.com 環境変数の設定
Renderのダッシュボードで以下の環境変数を設定：

- `NODE_ENV`: production
- `SUPABASE_URL`: SupabaseのプロジェクトURL
- `SUPABASE_KEY`: Supabaseのサービスロールキー

## デプロイフロー

1. `develop` ブランチで開発
2. プルリクエストを作成して `main` ブランチにマージ
3. GitHub Actions が自動的に起動
4. ビルドとテストが実行
5. Render.com に自動デプロイ

## ローカル本番環境テスト

```bash
# 本番環境と同じ条件でビルド・起動
npm run start:prod

# ビルドのみ
npm run build:prod

# 本番環境モードでサーバー起動
npm run test:prod
```

## 無料プランの制限

### Render.com (無料プラン)
- 750時間/月の動作時間
- 15分間アクセスがないとスリープ
- 500MB RAM
- 0.1 CPU

### Supabase (無料プラン)
- 500MB データベースサイズ
- 50,000 月間アクティブユーザー
- 5GB 帯域幅/月

## トラブルシューティング

### デプロイが失敗する場合
1. GitHub Actions のログを確認
2. Render.com のビルドログを確認  
3. 環境変数が正しく設定されているか確認

### アプリにアクセスできない場合
1. Render.com でサービスが起動しているか確認
2. ログでエラーメッセージを確認
3. 15分後に再度アクセス（スリープ解除）

## 代替デプロイオプション

他の無料プラットフォーム：
- **Railway**: 無料プランあり、より高性能
- **Vercel**: フロントエンド + Serverless Functions
- **Netlify**: 静的サイト + Netlify Functions  
- **Heroku**: 2022年11月より無料プランなし
