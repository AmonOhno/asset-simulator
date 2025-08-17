# マルチステージビルド: 本番環境とテスト環境両対応(ソースビルドは完了している前提)
FROM node:20-alpine AS base

# 作業ディレクトリの設定
WORKDIR /app

# パッケージマネージャーの設定
RUN npm install -g npm@10.9.0

# package.jsonとworkspace設定をコピー
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./

# ワークスペースの設定ファイルをコピー
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/mobile/package*.json ./apps/mobile/
COPY apps/mobile/tsconfig.json ./apps/mobile/
COPY apps/server/package*.json ./apps/server/
COPY apps/server/tsconfig.json ./apps/server/

# 依存関係のインストール
RUN npm install
RUN npm ci

# ソースコードをコピー
COPY packages/ ./packages/
COPY apps/ ./apps/

# ==================================================
# 開発/テスト環境ステージ
# ==================================================
FROM base AS development

# 環境変数の設定
ENV NODE_ENV=development
ENV PORT=3001
ENV REACT_APP_SUPABASE_URL=${REACT_APP_SUPABASE_URL}
ENV REACT_APP_SUPABASE_KEY=${REACT_APP_SUPABASE_KEY}
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}

# 開発用ポートを公開
EXPOSE 3001

# 開発サーバーの起動
CMD ["npm", "run", "dev"]

# ==================================================
# ビルドステージ
# ==================================================
FROM base AS builder

# ビルド実行
RUN npm run build

# ==================================================
# 本番環境ステージ
# ==================================================
FROM builder AS production

WORKDIR /app

# curlをインストール（ヘルスチェック用）
RUN apk add --no-cache curl

# 本番用の最小限の依存関係のみインストール
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/shared/tsconfig.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/
COPY apps/server/tsconfig.json ./apps/server/

# ビルド済みファイルをコピー
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/web/build ./apps/web/build
COPY --from=builder /app/apps/mobile/build ./apps/mobile/build
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# 環境設定ファイルをコピー
COPY apps/server/src/config ./apps/server/src/config

# 環境変数の設定
ENV NODE_ENV=production
ENV PORT=3001
ENV REACT_APP_SUPABASE_URL=$REACT_APP_SUPABASE_URL
ENV REACT_APP_SUPABASE_KEY=$REACT_APP_SUPABASE_KEY
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_KEY=$SUPABASE_KEY

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api || exit 1

# アプリケーション用ユーザーの作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

# ファイルの所有権を変更
RUN chown -R appuser:nodejs /app
USER appuser

# ポートを公開
EXPOSE 3001

# 本番サーバーの起動
CMD ["npm", "start"]
