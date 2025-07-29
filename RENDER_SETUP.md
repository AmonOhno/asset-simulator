# Render.com デプロイ設定手順

## 1. GitHub Secretsの設定

以下の環境変数をGitHubリポジトリの Settings > Secrets and variables > Actions で設定してください：

### GitHub Secrets
1. **SUPABASE_URL**
   - 値: `https://dfqtsogrhkrayfixnbtz.supabase.co`

2. **SUPABASE_KEY** 
   - 値: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXRzb2dyaGtyYXlmaXhuYnR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkzMTE2MiwiZXhwIjoyMDY4NTA3MTYyfQ.H5ufVadO5-k38NWY33WHeRYrkJmT5M4-FDa9lwcEo`
   - 説明: サーバーサイド用のservice_roleキー

3. **SUPABASE_ANON_KEY**
   - 値: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXRzb2dyaGtyYXlmaXhuYnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzExNjIsImV4cCI6MjA2ODUwNzE2Mn0.u-0qPl2i4fVqG6s-rLNe_2Tj3a-p3E-b3kI_i3kI_iI`
   - 説明: フロントエンド用の匿名ユーザーキー

4. **RENDER_SERVICE_ID**
   - 値: Render.comで作成したサービスのID

5. **RENDER_API_KEY**
   - 値: Render.comのAPIキー

## 2. Render.comでのシークレット設定

以下の環境変数をRender.comのダッシュボードで設定してください：

### Environment Secrets
1. **SUPABASE_URL**
   - 値: `https://dfqtsogrhkrayfixnbtz.supabase.co`

2. **SUPABASE_KEY** 
   - 値: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXRzb2dyaGtyYXlmaXhuYnR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkzMTE2MiwiZXhwIjoyMDY4NTA3MTYyfQ.H5ufVadO5-k38NWY33WHeRYrkJmT5M4-FDa9lwcEo`
   - 説明: サーバーサイド用のservice_roleキー

3. **SUPABASE_ANON_KEY**
   - 値: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcXRzb2dyaGtyYXlmaXhuYnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzExNjIsImV4cCI6MjA2ODUwNzE2Mn0.u-0qPl2i4fVqG6s-rLNe_2Tj3a-p3E-b3kI_i3kI_iI`
   - 説明: フロントエンド用の匿名ユーザーキー

## 2. デプロイ手順

1. Render.comにログイン
2. 新しいWebサービスを作成
3. GitHubリポジトリ（asset-simulator）を接続
4. `main`ブランチを選択
5. 上記の環境変数を設定
6. デプロイを実行

## 3. 自動デプロイ

- `main`ブランチにプッシュすると自動的にデプロイされます
- GitHub Actionsが成功した後、Render.comでのデプロイが開始されます

## 4. 確認事項

デプロイ後、以下を確認してください：
- アプリケーションが正常に起動している
- Supabaseへの接続が正常に動作している
- 静的ファイル（CSS、JS）が正しく配信されている
