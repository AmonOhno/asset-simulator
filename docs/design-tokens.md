# デザイントークン（hex・フォント）

## 重要な注記

現行サイト（www.city.saitama.lg.jp）の **実測 hex・フォントは未取得**。
本セッションの egress ポリシーで同サイトへのアクセスがブロックされたため、
実測できていない（docs/missing-info.md）。

実測手順（アクセス可能な環境で）:

```bash
cd capture
npm run capture:current
# → output/current-site/ui-info.json に
#    色（hex 出現頻度順）とフォントファミリーが出力される
```

取得後、本ドキュメントの「現行サイト実測値」節に転記し、
必要なら `app/src/styles/tokens.css` を差し替えること。

## モダナイズ版トークン（新規定義）

さいたま市のシンボル（市の木: ケヤキ、市の花: サクラソウ ※公式サイトで要再確認）
をモチーフに新規定義した。定義体: `app/src/styles/tokens.css`

### カラー

| トークン | 値 | 用途 |
|---------|-----|------|
| `--color-primary` | `#2E7D46` | ブランド（ケヤキの緑）・主ボタン |
| `--color-primary-dark` | `#1E5C31` | フッター背景・見出し文字 |
| `--color-primary-soft` | `#E8F3EC` | ナビ背景 |
| `--color-accent` | `#D6607F` | アクセント（サクラソウのピンク）・見出し罫 |
| `--color-accent-soft` | `#FBEEF2` | カテゴリバッジ背景 |
| `--color-emergency` | `#B3261E` | 緊急情報 |
| `--color-emergency-bg` | `#FDECEA` | 緊急情報背景 |
| `--color-link` | `#0B57D0` | リンク |
| `--color-link-visited` | `#6A3AB2` | 訪問済みリンク |
| `--color-text` | `#1A1A1A` | 本文 |
| `--color-text-muted` | `#55605A` | 補足テキスト |
| `--color-bg` | `#FFFFFF` | ページ背景 |
| `--color-surface` | `#F4F6F4` | カード・面 |
| `--color-border` | `#D4DAD6` | 罫線 |
| `--color-focus` | `#B78103` | フォーカスリング |

本文/背景 `#1A1A1A` on `#FFFFFF` はコントラスト比 17.6:1、
リンク `#0B57D0` on `#FFFFFF` は 6.9:1 で WCAG AA（4.5:1）を満たす。
ハイコントラストモード（`data-contrast="high"`）ではさらに強調した値に切替わる。

### タイポグラフィ

| トークン | 値 |
|---------|-----|
| `--font-family-base` | Hiragino Kaku Gothic ProN / Hiragino Sans / Noto Sans JP / Yu Gothic / Meiryo / system-ui |
| `--font-size-base` | 16px（文字サイズ拡大モードで 20px） |
| `--line-height-base` | 1.7（日本語本文向け） |

Web フォントは使わず OS ネイティブの日本語フォントスタックを採用
（初期表示速度と CJK フォントの容量を考慮）。

### スペーシング・レイアウト

- 4px グリッド（`--space-1`〜`--space-8`）
- コンテンツ最大幅 1080px、モバイルファースト（ブレークポイント 768px）
- タップターゲット最小 44px（`--tap-target-min`、WCAG 2.5.8）

## 現行サイト実測値（TODO）

> `npm run capture:current` 実行後にここへ転記する。

| 項目 | 値 |
|------|-----|
| 主要背景色 | （未取得） |
| ブランドカラー | （未取得） |
| リンク色 | （未取得） |
| font-family | （未取得） |
| viewport meta / レスポンシブ対応 | （未取得） |
