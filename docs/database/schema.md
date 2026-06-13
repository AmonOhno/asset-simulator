# DB テーブル定義

ER 図: [er_diagram.puml](er_diagram.puml)

## マルチテナント設計

全テーブルに `user_id` カラムを持ち、Supabase の Row Level Security（RLS）でユーザーごとにデータを分離。API サーバー側でも RPC に `p_user_id` を渡して DB 側でフィルタする。

## テーブル一覧

### journal_accounts（勘定科目）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `jacc_<uuid>` |
| name | string | 勘定科目名 |
| category | enum | Asset / Liability / Equity / Revenue / Expense |
| balance | numeric | 残高（仕訳集計値） |
| user_id | string FK→users | — |
| created_at | timestamp | — |
| updated_at | timestamp | — |

---

### journal_entries（仕訳エントリー）

複式簿記の仕訳を記録するコアテーブル。

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `je_<uuid>` |
| date | date | 仕訳日 |
| description | string | 摘要 |
| debit_account_id | string FK→journal_accounts | 借方勘定科目 |
| credit_account_id | string FK→journal_accounts | 貸方勘定科目 |
| amount | numeric | 金額 |
| user_id | string FK→users | — |
| created_at | timestamp | — |
| updated_at | timestamp | — |

---

### regular_journal_entries（定期仕訳テンプレート）

繰り返し仕訳のテンプレート。実行すると `journal_entries` が生成される。

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `reg_<uuid>` |
| name | string | テンプレート名 |
| description | string | 説明（任意） |
| debit_account_id | string FK→journal_accounts | 借方勘定科目 |
| credit_account_id | string FK→journal_accounts | 貸方勘定科目 |
| amount | numeric | 金額（任意） |
| start_date | date | 有効開始日 |
| end_date | date | 有効終了日 |
| frequency | enum | daily / weekly / monthly / yearly |
| date_of_year | date(mm/dd) | 毎年の日付（yearly 時） |
| date_of_month | integer | 毎月の日付（monthly 時） |
| holiday_div_of_month | boolean | 休日ずらしフラグ（monthly 時） |
| date_of_week | integer | 曜日番号（weekly 時） |
| mon_flg_of_week ～ sun_flg_of_week | boolean | 対象曜日フラグ（weekly 時） |
| public_holiday_ex_flg_week | boolean | 祝日除外フラグ（weekly 時） |
| user_id | string FK→users | — |
| created_at | timestamp | — |
| updated_at | timestamp | — |

---

## 勘定科目カテゴリ（AccountCategory）

```
Asset      — 資産
Liability  — 負債
Equity     — 純資産
Revenue    — 収益
Expense    — 費用
```

## 繰り返し頻度（RecurrenceFrequency）

```
daily    — 毎日
weekly   — 毎週
monthly  — 毎月
yearly   — 毎年
```
