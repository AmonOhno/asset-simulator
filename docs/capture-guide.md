# キャプチャ実行ガイド

Playwright による画面キャプチャ・UI 情報抽出・ナンバリング注釈の手順。

## 前提

```bash
npm install            # ルートで（workspaces: app, capture）
npx playwright install chromium   # ブラウザ未導入の場合
# 既存の Chromium を使う場合: export CHROMIUM_PATH=/path/to/chrome
```

## 1. 現行サイトのキャプチャ（要: 外部ネットワーク）

```bash
cd capture
npm run capture:current
```

出力 `capture/output/current-site/`:

| ファイル | 内容 |
|---------|------|
| `mobile(-full).png` | iPhone 14 相当（390×844, DPR3）のキャプチャ |
| `tablet(-full).png` | iPad 相当 |
| `desktop(-full).png` | 1366×900 |
| `*-zoom-adjusted-full.png` | **非レスポンシブ検出時のみ**。コンテンツ幅に合わせてビューポートを拡大（ズームアウト相当の倍率調整）した全画面 |
| `ui-info.json` | 色（hex 出現頻度順）・font-family・全リンク（実 URL）・全画像（実 URL/alt/サイズ）・ランドマーク・generator meta |
| `page.html` | 取得時点の生 HTML（テックスタック特定用） |
| `assets/` | 実画像ファイル（`--download-assets` 時） |

取得後にやること:

1. `ui-info.json` の色・フォントを `docs/design-tokens.md` の実測値欄へ転記
2. `page.html` から CMS / JS ライブラリを特定し `docs/tech-stack-current.md` を更新
3. 実画像を `app/public/` に配置してロゴ等を差し替え

## 2. 現行サイトへのナンバリング注釈

```bash
npm run annotate:current
```

`capture/maps/current-site.json` のセレクターは未検証の推定値。
出力 `legend.md` の未検出（❌）を見ながらセレクターを実 DOM に合わせて修正し、
再実行して全要素に F/D 番号を付与する。

## 3. モダナイズ版のキャプチャ・注釈

```bash
npm run build && npm run preview   # 別ターミナルで（port 4173）
cd capture
node capture.mjs --url http://localhost:4173/ --label local-app
node annotate.mjs --url http://localhost:4173/ --map maps/local-app.json --label local-app
```

コミット済みの結果: `docs/captures/local-app/`

## リモート実行環境での制約

このリポジトリを構築したリモート環境では `www.city.saitama.lg.jp` への
egress がポリシーでブロックされていた（`CONNECT 403`）。現行サイト系の
コマンド（`capture:current` / `annotate:current`）は**手元のマシンで実行**すること。
