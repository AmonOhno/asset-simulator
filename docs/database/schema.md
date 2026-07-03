# DB テーブル定義

ER 図: [er_diagram.puml](er_diagram.puml)

## マルチテナント設計

全テーブルに `user_id` カラムを持ち、Supabase Auth の `auth.users` を参照する。Supabase の Row Level Security（RLS）でユーザーごとにデータを分離する想定。フロントエンドの RPC 呼び出しには必ず `p_user_id` を渡し、DB 側でフィルタする（詳細は [`docs/api/specification.md`](../api/specification.md)）。

## テーブル一覧

### journal_accounts（勘定科目）

型定義: `packages/shared/src/types/common.ts` の `JournalAccount`。

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `jacc_<uuid>` |
| name | string | 勘定科目名 |
| category | enum | Asset / Liability / Equity / Revenue / Expense |
| balance | numeric | 残高（仕訳集計値。RPC `create_journal_entry` 実行時に更新） |
| user_id | string FK→auth.users | — |
| created_at | timestamp | — |
| updated_at | timestamp | — |

ソート順（`getJournalAccounts`）: `category` 昇順 → `name` 昇順。

---

### journal_entries（仕訳エントリー）

複式簿記の仕訳を記録するコアテーブル。型定義: `JournalEntry`。

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `je_<uuid>` |
| date | date | 仕訳日（`YYYY-MM-DD`） |
| description | string | 摘要 |
| debit_account_id | string FK→journal_accounts | 借方勘定科目 |
| credit_account_id | string FK→journal_accounts | 貸方勘定科目 |
| amount | numeric | 金額 |
| user_id | string FK→auth.users | — |
| created_at | timestamp | — |
| updated_at | timestamp | — |

新規作成は RPC `create_journal_entry(entry_data jsonb, update_balances boolean)` 経由（残高更新をあわせて行うため）。更新・削除は PostgREST 直接。

---

### regular_journal_entries（定期仕訳テンプレート）

繰り返し仕訳のテンプレート。実行すると `journal_entries` が生成される。型定義: `RecurringTransaction`。

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `reg_<uuid>` |
| name | string | テンプレート名 |
| description | string | 摘要（仕訳作成時にそのまま使用） |
| debit_account_id | string FK→journal_accounts | 借方勘定科目 |
| credit_account_id | string FK→journal_accounts | 貸方勘定科目 |
| amount | numeric | 金額（0/未設定の場合は実行時金額指定も可） |
| frequency | enum | `daily` / `weekly` / `monthly` / `yearly` / `free`（型 `RecurrenceFrequency`） |
| start_date | date | 有効開始日 |
| end_date | date | 有効終了日（任意） |
| date_of_year | string | 毎年の日付。`MM-DD` または `YYYY-MM-DD` の両形式を許容（`yearly` 時。`recurrence.ts` の `parseDateOfYear` でパース） |
| date_of_month | integer | 毎月の日付 1〜31（`monthly` 時。月末日を超える場合はその月の最終日に clamp） |
| holiday_div_of_month | string enum | 休日（土日）ずらし区分: `'before'`（前倒し） / `'after'`（後倒し） / `'none'`（なし）。`monthly` / `yearly` の両方で使用 |
| mon_flg_of_week 〜 sun_flg_of_week | boolean | 対象曜日フラグ（`weekly` 時） |
| public_holiday_ex_flg_of_week | boolean | 土日除外フラグ（`weekly` 時。true なら土日の実行日を除外する） |
| last_executed_date | date | 最終実行日（`YYYY-MM-DD`）。同日重複実行防止に使用 |
| user_id | string FK→auth.users | — |
| created_at | timestamp | — |
| updated_at | timestamp | — |

ソート順（`getRegularJournalEntries`）: `start_date` 降順。

> 旧版との差分: `holiday_div_of_month` は boolean ではなく文字列 enum。`public_holiday_ex_flg_of_week` のスペル修正（旧: `public_holiiday_ex_flg_week`。コード上の camelCase `publicHolidayExFlgOfWeek` に対応する snake_case）。`thu_flg_of_week` のスペル修正（旧: `thr_flg_of_week`）。`last_executed_date` を追加。`frequency` に `free` を追加。

---

### schedule_events（スケジュールイベント）

型定義: `ScheduleEvent`。

| カラム | 型 | 説明 |
|-------|---|------|
| event_id | string PK | `event_<uuid>` |
| title | string | イベント名（最大100文字、UI 側でバリデーション） |
| all_day_flg | boolean | 終日フラグ |
| start_date | date | 開始日 |
| start_time | string \| null | 開始時間（`HH:MM`。終日の場合は null） |
| end_date | date | 終了日 |
| end_time | string \| null | 終了時間（終日の場合は null） |
| description | string | イベント説明（任意） |
| created_at | timestamp | クライアントで `new Date().toISOString()` を発行して insert |
| user_id | string FK→auth.users | — |

---

### accounts / credit_cards（未使用マスタ）

`packages/shared/src/types/common.ts` に型定義（`Account`, `CreditCard`）は残っているが、**現行 UI からは利用されていない**。desktop の `JournalAccountManager.tsx` に `isSystemAccount(id)`（`acc_` / `card_` プレフィックス判定）が残るのみで、これらのテーブルへの CRUD 画面・ストアアクションは存在しない。

| テーブル | 主なカラム（型定義上） |
|---------|----------------------|
| accounts | id(`acc_`), name, institution, branch_number, type, account_number, account_holder, user_id |
| credit_cards | id(`card_`), name, closing_day, payment_day, linked_account_id, user_id |

---

## VIEW

### v_journal_entries_for_calendar

カレンダー表示用。`journal_entries` に借方・貸方の勘定科目名・カテゴリを事前 JOIN 済み。型定義: `CalendarJournalEntry`。

| カラム | 型 | 説明 |
|-------|---|------|
| id | string | 仕訳ID |
| date | date | 取引日 |
| description | string | 摘要 |
| amount | numeric | 金額 |
| debit_account_id / debit_account_name / debit_account_category | — | 借方勘定科目情報 |
| credit_account_id / credit_account_name / credit_account_category | — | 貸方勘定科目情報 |
| user_id | string | — |

## RPC 関数

| 関数 | 引数 | 戻り値 | 用途 |
|-----|------|-------|------|
| `create_journal_entry` | `entry_data jsonb`, `update_balances boolean` | 作成された仕訳行 | 仕訳作成＋勘定科目残高更新 |
| `fn_balance_sheet` | `p_user_id`, `p_end_date` | `user_id, account_id, category, name, sum_amount` の行集合 | 貸借対照表の勘定科目別集計 |
| `fn_profit_loss` | `p_user_id`, `p_start_date`, `p_end_date` | 同上 | 損益計算書の勘定科目別集計 |

詳細は [`docs/api/specification.md`](../api/specification.md) を参照。

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
free     — 都度（自動実行対象外、手動実行のみ）
```

## 休日ずらし区分（HolidayDivOfMonth）

```
none    — ずらしなし
before  — 前倒し（土曜: -1日 / 日曜: -2日）
after   — 後倒し（土曜: +2日 / 日曜: +1日）
```

`packages/shared/src/utils/dateUtils.ts` の `adjustWeekendDate` に実装。
