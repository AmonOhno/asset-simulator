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
| include_in_summary | boolean | 貸借対照表サマリーに含めるか（既定値 `true`）。`false` の場合、株など価値が変動する資産（変動資産）をダッシュボードの BS 集計・合計から除外する |
| user_id | string FK→auth.users | — |
| created_at | timestamp | — |
| updated_at | timestamp | — |

ソート順（`fetchJournalAccounts`）: `category` 昇順 → `name` 昇順。

`include_in_summary = false` の勘定科目は `fn_balance_sheet` の戻り値自体には引き続き含まれる（DB 側では絞り込まない）。除外はフロントエンド側で `filterSummaryIncludedRows`（`packages/shared/src/utils/balanceSheet.ts`）を用いて行う（desktop の `JournalDashboard`、mobile の `App`/`BalanceSheetCard` で共通利用）。

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

ソート順（`fetchRegularJournalEntries`）: `start_date` 降順。

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

### goals（支出目標）

対象勘定科目（`goal_accounts` に 1 件以上）の**合計**に対する、期間（日次/月次）ごとの支出目標。型定義: `Goal`。

| カラム | 型 | 説明 |
|-------|---|------|
| id | text PK | `goal_<uuid>`（クライアント側で発行） |
| user_id | uuid FK→auth.users | — |
| name | text | 目標の表示名。空文字の場合は UI 側で対象勘定科目名から生成（既定値 `''`） |
| period | string enum | `day`（日次） / `month`（月次）（型 `GoalPeriod`） |
| amount | numeric | 目標金額（円） |
| created_at | timestamptz | — |

`unique(id, user_id)` 制約あり（`goal_accounts` からの複合 FK 用）。
対象勘定科目は `goal_accounts` に分離しているため、「1 科目 1 目標」の一意制約は持たない。
同一の対象科目セット・期間での二重登録は UI 側（`isSameAccountSet` による重複判定）で抑止する。

### goal_accounts（支出目標の対象勘定科目）

1 つの支出目標に紐づく勘定科目。ここに紐づく科目の実績を合計して目標と比較する。

| カラム | 型 | 説明 |
|-------|---|------|
| goal_id | text FK→goals | 対象の支出目標（`(goal_id, user_id)` → `goals(id, user_id)`、ON DELETE CASCADE） |
| account_id | text FK→journal_accounts | 対象勘定科目（`(account_id, user_id)` → `journal_accounts(id, user_id)`、ON DELETE CASCADE。費用科目を想定） |
| user_id | uuid FK→auth.users | — |
| created_at | timestamptz | — |

主キーは `(goal_id, account_id)`。
`goals` と `goal_accounts` の書き込みが分離しないよう、保存は RPC `save_goal` で一括して行う（[api/specification.md](../api/specification.md) 参照）。

トリガー `trg_goal_accounts_delete_orphan_goals`（AFTER DELETE）で、対象科目が 0 件になった `goals` 行を削除する。
これにより、勘定科目を削除したときに対象が空の目標が残らない（`goals.account_id` があった頃の CASCADE 削除挙動を維持）。
`save_goal` が対象科目の追加を削除より先に行うのは、入れ替え途中で対象が一時的に 0 件になりこのトリガーが発火するのを避けるため。

---

### accounts / credit_cards（未使用マスタ）

`packages/shared/src/types/common.ts` に型定義（`Account`, `CreditCard`）は残っているが、**現行 UI からは利用されていない**。desktop の `JournalAccountManager.tsx` に `isSystemAccount(id)`（`acc_` / `card_` プレフィックス判定）が残るのみで、これらのテーブルへの CRUD 画面・ストアアクションは存在しない。

| テーブル | 主なカラム（型定義上） |
|---------|----------------------|
| accounts | id(`acc_`), name, institution, branch_number, type, account_number, account_holder, user_id |
| credit_cards | id(`card_`), name, closing_day, payment_day, linked_account_id, user_id |

---

### api_tokens（MyOS 連携用 API トークン）

MyOS からの読み取り専用連携用。詳細は [`docs/api/myos_integration.md`](../api/myos_integration.md)。

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `tok_<uuid>` |
| user_id | uuid FK→auth.users | — |
| name | string | トークン用途名（例: `myos`） |
| token_hash | string | 平文トークンの SHA-256 hex ハッシュ（一意）。平文は保存しない |
| created_at | timestamp | — |
| last_used_at | timestamp \| null | Edge Function 認証成功のたびに更新 |

発行は SECURITY DEFINER 関数 `fn_issue_api_token(p_user_id, p_name)` を SQL Editor から実行する（`anon` / `authenticated` には EXECUTE 権限なし）。RLS は「本人のみ select 可」のみで insert/update/delete ポリシーは設けていない。

---

## キャリア設計アプリのテーブル（career_*）

`career/`（Career Compass）が使うテーブル群。資産シミュレーターのテーブルとは
リレーションを持たず、`auth.users` のみを共有する。全テーブルで RLS を有効化し、
`auth.uid() = user_id` の行だけを参照・更新できる。型定義: `career/src/types/career.ts`。

仕様の詳細は [`docs/career/specification.md`](../career/specification.md) を参照。

### career_profiles（基本情報）

ユーザーごとに 1 行（`user_id` に UNIQUE）。

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `prof_<uuid>` |
| full_name / full_name_kana | string | 氏名・フリガナ（履歴書に転記） |
| birth_date | date \| null | 生年月日。履歴書の満年齢算出に使う |
| gender / email / phone / postal_code / address / nearest_station | string | 履歴書の基本情報欄 |
| headline | string | 職務経歴書冒頭の一行キャッチ |
| current_company / current_job_title | string | 現在の勤務先・肩書 |
| years_of_experience | numeric \| null | エンジニア経験年数 |
| current_annual_income | numeric \| null | 現年収（円） |
| target_annual_income | numeric | 目標年収（円）。既定 10,000,000 |
| job_change_target_date | date \| null | 転職希望時期 |
| github_url / portfolio_url / linkedin_url / blog_url | string | 公開リンク（可視性スコアに使う） |

### career_skills（保有スキル）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `skill_<uuid>` |
| category | enum | language / framework / cloud / database / infra / data / security / tool / domain / management |
| name | string | 技術名 |
| level | int (1〜5) | 1: 学習中 〜 5: 他者を指導できる |
| years_of_experience | numeric \| null | 実務経験年数 |
| last_used_on | date \| null | 最終使用年月。鮮度スコアの算出に使う |
| is_core | boolean | 書類の前面に出す主力スキル |
| note / sort_order | string / int | — |

ソート順（`fetchSkills`）: `sort_order` 昇順 → `level` 降順。

### career_experiences（職歴）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `exp_<uuid>` |
| company_name | string | 会社名 |
| employment_type | enum | full_time / contract / dispatch / freelance / part_time / internship |
| started_on / ended_on | date | `ended_on` が NULL なら在籍中（履歴書の「現在に至る」判定） |
| job_title / department / industry | string | 役職・所属・業界 |
| headcount | int \| null | 従業員数 |
| annual_income | numeric \| null | 在籍時の年収（円） |
| business_description / achievements | string | 事業内容・在籍中の実績 |

### career_projects（経験プロジェクト）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `proj_<uuid>` |
| experience_id | string \| null FK→career_experiences | 個人開発は NULL。職歴削除時は `SET NULL` |
| name / role / industry | string | 案件名・役割・業界 |
| started_on / ended_on | date \| null | 期間 |
| team_size | int \| null | チーム規模 |
| overview / responsibilities | string | 概要・担当業務 |
| challenge / action / result | string | 課題 → 施策 → 成果 |
| impact_metric | string | 定量成果。到達力スコアの「成果の定量化」に使う |
| tech_stack / phases | text[] | 使用技術・担当工程 |
| is_highlighted | boolean | 書類の先頭に出す主力プロジェクト |

### career_educations（学歴） / career_certifications（資格）

| テーブル | 主なカラム |
|---------|-----------|
| career_educations (`edu_`) | school_name, faculty, degree, started_on, ended_on, status（卒業 / 中退 / 在学中）, note |
| career_certifications (`cert_`) | name, issuer, acquired_on, expires_on, score, note |

### career_highlights（文章ブロック）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `pr_<uuid>` |
| kind | enum | summary / self_pr / motivation / strength / future |
| title / body | string | 識別用タイトル・本文 |
| is_default | boolean | 書類生成時に既定で使うブロック（種別ごとに 1 件を想定） |

### career_preferences（希望条件）

ユーザーごとに 1 行（`user_id` に UNIQUE）。業務内容の希望と、それ以外の希望を 1 行にまとめる。

| 区分 | カラム |
|------|-------|
| 業務内容 | desired_job_titles, desired_roles, desired_industries, desired_project_types, desired_tech_stack, avoid_tech_stack, desired_phases, desired_team_style |
| 業務内容以外 | income_floor, desired_income_min, desired_income_ideal（既定 10,000,000）, desired_locations, remote_preference（full_remote / hybrid / onsite / any）, max_commute_minutes, acceptable_overtime_hours, min_holidays, side_job_required, flextime_required, desired_benefits, desired_company_sizes, desired_employment_types |
| 優先順位 | must_have_conditions, nice_to_have_conditions, deal_breakers |
| その他 | job_change_reason, note |

配列カラムはすべて `text[]`、既定値は空配列。

### career_applications（応募・選考管理）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `app_<uuid>` |
| company_name / job_title / source / agent_name | string | 応募先と応募経路 |
| status | enum | wishlist / applied / document_screening / interview_1 / interview_2 / interview_final / offer / accepted / rejected / declined |
| applied_on / next_action / next_action_on | date / string | 応募日・次アクション |
| income_range_min / income_range_max | numeric \| null | 求人票の提示レンジ（円） |
| offered_income | numeric \| null | 実オファー年収（円） |
| location / remote_policy / industry | string | 勤務地・リモート可否・業界 |
| tech_stack / benefits | text[] | マッチ度算出に使う |
| job_url / memo | string | — |

ソート順（`fetchApplications`）: `next_action_on` 昇順 → `created_at` 降順。

### career_documents（生成書類）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string PK | `doc_<uuid>` |
| kind | enum | resume / career_history / skill_sheet |
| format | enum | markdown / html / text |
| title / content | string | 生成時のタイトル・本文 |
| application_id | string \| null FK→career_applications | 応募先削除時は `SET NULL` |
| generated_at | timestamp | 生成日時（一覧のソートキー） |

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
