# 定期仕訳機能

## 概要

毎月の家賃・給与・サブスクリプションなど、繰り返し発生する仕訳のテンプレートを管理し、任意のタイミングで `journal_entries` に展開（実行）する機能。

## ユースケース

- 繰り返し仕訳のテンプレートを登録・編集する
- テンプレートを実行して仕訳エントリーを生成する
- 有効期間（`start_date` ～ `end_date`）を設定する

## データ構造

`regular_journal_entries` テーブル（詳細: [database/schema.md](../database/schema.md)）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string | `reg_<uuid>` 形式 |
| name | string | テンプレート名 |
| description | string | 説明（任意） |
| debit_account_id | string | 借方勘定科目 ID |
| credit_account_id | string | 貸方勘定科目 ID |
| amount | numeric | 金額（任意） |
| start_date | date | 有効開始日 |
| end_date | date | 有効終了日 |
| frequency | string | 繰り返し頻度（daily / weekly / monthly / yearly） |
| date_of_month | integer | 毎月何日か（monthly 時） |
| date_of_week | integer | 曜日（weekly 時） |

## 繰り返し頻度

| frequency | 対応カラム |
|-----------|-----------|
| `daily` | — |
| `weekly` | `date_of_week`, `mon_flg_of_week` ～ `sun_flg_of_week`, `public_holiday_ex_flg_week` |
| `monthly` | `date_of_month`, `holiday_div_of_month` |
| `yearly` | `date_of_year` |

## API エンドポイント

→ [api/specification.md](../api/specification.md) の「Regular Journal Entries」セクション参照

## 関連コンポーネント

→ [ui/specification.md](../ui/specification.md) の「定期取引タブ」セクション参照
