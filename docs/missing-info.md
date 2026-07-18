# 不足情報一覧（要取得・要検証）

構築時のリモート実行環境では、組織の egress ポリシーにより
`www.city.saitama.lg.jp`（および一般 Web）への接続が `CONNECT 403` で
ブロックされていた。GitHub / npm 等のみ許可。
そのため以下は**未取得**であり、取得方法とセットで列挙する。

## 未取得（現行サイトへのアクセスが必要）

| # | 項目 | 取得方法 |
|---|------|---------|
| 1 | 現行サイトのスクリーンショット（モバイル/タブレット/デスクトップ、非レスポンシブ時の倍率調整版含む） | `cd capture && npm run capture:current` |
| 2 | 実測 hex カラーパレット・font-family | 同上 → `ui-info.json` → `docs/design-tokens.md` へ転記 |
| 3 | 実画像ファイル（ロゴ・バナー等）と alt テキスト | `capture:current`（`--download-assets` 付き）→ `app/public/` へ配置 |
| 4 | CMS 製品名・サーバー構成（generator meta / レスポンスヘッダー / HTML コメント） | `page.html` とヘッダーを確認 → `docs/tech-stack-current.md` 更新 |
| 5 | レスポンシブ対応の有無・viewport meta | `ui-info.json` の `responsive` / `viewportMeta` |
| 6 | トップページの全リンク・全 UI 要素の網羅（バナー枠 D06 など） | `ui-info.json` の `links` + `annotate:current` のセレクター修正 |
| 7 | 現行サイトの対応言語一覧・翻訳方式 | ヘッダーの言語リンクを確認 → `docs/i18n.md` 更新 |
| 8 | A11Y 機能の実装方式（音声読み上げ・ふりがな有無） | 実ページで確認 → `docs/a11y.md` 更新 |
| 9 | サイト内検索の方式（自前 / 外部カスタム検索） | 検索フォームの action を確認 |

## 未検証（コード側）

| # | 項目 | 検証方法 |
|---|------|---------|
| 10 | `観光・文化・スポーツ` のカテゴリ URL（`/004/index.html` は推定。`siteData.ts` で `verified: false`） | 実サイトで確認し `app/src/data/siteData.ts` を修正 |
| 11 | Supabase ローカルスタック起動（構築環境では Docker イメージの blob 取得も egress ブロック） | 手元で `supabase start` → seed 投入 → D01〜D03 が Supabase ソースで表示されること |
| 12 | パスキー登録〜ログインの E2E（WebAuthn は実ブラウザ + 認証器が必要） | `docs/auth-passkey.md` の手順で手元検証 |
| 13 | 市の木・市の花（ケヤキ / サクラソウ）を配色根拠にした点 | 市公式ページで確認 |

## 取得済み（このリポジトリに反映済み）

- 主要カテゴリ・10 区・主要メニュー・フッターの**実 URL**（検索エンジンの
  インデックス経由で確認、`app/src/data/siteData.ts` に `verified` フラグ付きで格納）
- URL 規則（`pNNNNNN.html`、`_d/fil/` 添付、区名ローマ字ディレクトリ）
- 携帯サイト `/mobile/`・英語版 `/en/` の存在
- 市役所所在地・代表電話（公開情報）
