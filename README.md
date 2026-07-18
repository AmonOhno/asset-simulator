# さいたま市公式サイト モダナイゼーション学習プロジェクト

さいたま市公式ホームページ（https://www.city.saitama.lg.jp/）を題材に、
レガシー Web サイトのモダナイゼーションを学習するプロジェクト。
**さいたま市とは無関係の非公式・個人学習用リポジトリ**です。

| | 現行サイト | モダナイズ版（本リポジトリ） |
|---|---|---|
| 配信 | 静的 HTML（CMS 出力・推定） | React 19 + TypeScript + Vite SPA |
| モバイル | 別サイト `/mobile/`（推定） | モバイルファースト・レスポンシブ |
| 動的コンテンツ | CMS 再生成 | Supabase（PostgreSQL + RLS） |
| 認証 | ― | パスキー（WebAuthn） |
| I18N | 別ページ + 機械翻訳（推定） | react-i18next（ja/en） |
| A11Y | 文字サイズ・色合い変更 | 同機能 + セマンティック HTML / WCAG AA |

## モバイル版プレビュー

注釈付きキャプチャ（F=固定値・青 / D=変数・橙 のナンバリング）:
[`docs/captures/local-app/annotated-mobile-full.png`](docs/captures/local-app/annotated-mobile-full.png)
（定義: [`docs/ui-inventory.md`](docs/ui-inventory.md)）

## ディレクトリ構成

```
├── app/        # モダナイズ版フロントエンド（Vite + React + TS）
├── supabase/   # ローカル環境設定・マイグレーション・シード・Edge Functions
│   └── functions/passkey-{register,auth}/   # WebAuthn（パスキー）
├── capture/    # Playwright キャプチャ＆ナンバリング注釈パイプライン
└── docs/       # 設計ドキュメント（索引: docs/README.md）
```

## セットアップ

```bash
npm install

# フロントエンドのみ（Supabase 未接続時はフォールバックデータで動作）
npm run dev            # http://localhost:5173

# Supabase ローカル環境（Docker 必須）
supabase start         # 出力の anon key を app/.env へ（app/.env.example 参照）
supabase functions serve passkey-register passkey-auth
```

## キャプチャパイプライン

```bash
cd capture
npm run capture:current    # 現行サイトの実測（要: 外部ネットワーク）
npm run annotate:local     # モダナイズ版へ F/D ナンバリング注釈
```

詳細: [`docs/capture-guide.md`](docs/capture-guide.md)

## 既知の制約

構築時のリモート環境は egress 制限により現行サイトへアクセスできなかったため、
実測系の情報（スクリーンショット・hex・フォント・CMS 特定・実画像）は未取得。
**不足情報と取得手順は [`docs/missing-info.md`](docs/missing-info.md) に集約**している。

## リポジトリについて

このプロジェクトは専用プライベートリポジトリ
`AmonOhno/saitama-city-modernization` 用に作られたが、構築セッションの
GitHub アクセスが `asset-simulator` に限定されていたため、
`asset-simulator` の orphan ブランチ（履歴・内容とも独立）として push している。
以下で専用リポジトリへ移行できる:

```bash
git clone -b claude/saitama-city-modernization-vor4ot \
  https://github.com/AmonOhno/asset-simulator.git saitama-city-modernization
cd saitama-city-modernization
git remote set-url origin https://github.com/AmonOhno/saitama-city-modernization.git
git push -u origin claude/saitama-city-modernization-vor4ot:main
```
