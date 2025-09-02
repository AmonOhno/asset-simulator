# マルチステージビルド: 本番環境

# ==================================================
# 環境構築ステージ
# ==================================================
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
COPY apps/server/package*.json ./apps/server/
COPY apps/server/tsconfig.json ./apps/server/

# 依存関係のインストール
RUN npm ci


# ==================================================
# ビルドステージ
# ==================================================
FROM base AS builder

# ソースコードをコピー
COPY packages/ ./packages/
COPY apps/ ./apps/

# ビルド
RUN npm run build

# ==================================================
# 本番環境ステージ
# ==================================================
FROM node:20-alpine AS production

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
COPY apps/web/package*.json ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/

# 本番環境用の依存関係をインストール
RUN npm ci --omit=dev

# ビルド済みファイルをコピー
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/web/build ./apps/web/build
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# 基本的な環境変数の設定
ENV NODE_ENV=production
ENV PORT=3001

# デプロイ先で必要
COPY /etc/secrets/envfile ./

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# アプリケーション用ユーザーの作成
RUN addgroup -g 1001 -S nodejs
RUN adduser -S appuser -u 1001

# ファイルの所有権を変更
RUN chown -R appuser:nodejs /app
USER appuser

# ポートを公開
EXPOSE 3001

# 本番サーバーの起動
CMD ["npm", "run", "start"]
