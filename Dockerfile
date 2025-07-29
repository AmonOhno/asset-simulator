# Node.js 18をベースイメージとして使用
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

# 依存関係をインストール
RUN npm ci --only=production

# アプリケーションのソースコードをコピー
COPY . .

# Webアプリケーションをビルド
RUN npm run build:web

# サーバーアプリケーションをビルド
RUN npm run build:server

# ポート3001を公開
EXPOSE 3001

# 本番環境変数を設定
ENV NODE_ENV=production

# アプリケーションを起動
CMD ["npm", "start"]
