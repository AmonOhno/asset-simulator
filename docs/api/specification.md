# Asset Simulator API 設計書（Supabase 直接アクセス版）

> 旧版は廃止済みの Express API サーバー（`localhost:3001`）を前提にしていたため全面的に書き直した。
> 現行はフロントエンドの Zustand ストア（`packages/shared/src/stores/*.ts`）が `@supabase/supabase-js` を用いて
> Supabase（PostgreSQL + PostgREST + RPC）に直接アクセスする構成であり、Express サーバーは存在しない。

## 目次
- [概要](#概要)
- [データアクセス規約](#データアクセス規約)
- [テーブル直接アクセス（PostgREST）一覧](#テーブル直接アクセスpostgrest一覧)
- [VIEW](#view)
- [RPC 関数一覧](#rpc-関数一覧)
- [ストアアクション一覧](#ストアアクション一覧)
- [定期取引の実行仕様](#定期取引の実行仕様)

---

## 概要

- **バックエンド**: Supabase（PostgreSQL + PostgREST + RPC）。専用の API サーバーはない
- **クライアント**: `packages/shared/src/stores/authStore.ts` で生成する単一の `SupabaseClient`（`createClient(supabaseUrl, supabaseAnonKey)`）を全ストアで共有
- **認証**: Supabase Auth。`useAuthStore` がセッション（JWT）を保持し、`onAuthStateChange` で変化を監視する。PostgREST へのリクエストにはセッションの JWT が自動付与される
- **アクセス制御**: 全アクセスに `user_id`（Supabase の `auth.users.id`）フィルタを付与し、DB 側の Row Level Security（RLS）と組み合わせて多重に保護する想定
- **日付形式**: `YYYY-MM-DD`（`formatDateLocal` でタイムゾーンに依存せず生成。JST 環境でも前日にずれない）

---

## データアクセス規約

- **RPC 引数の命名規則**: `p_` プレフィックス（例: `p_user_id`, `p_end_date`, `p_start_date`）
- **RPC には必ず `p_user_id` を渡して DB 側でフィルタする**。クライアント側 JS でのユーザーフィルタは行わない
- **ケース変換**: DB は snake_case、フロントは camelCase。`packages/shared/src/utils/caseConvert.ts` の `toCamelCase` / `toSnakeCase` で変換する
  - 取得系: `toCamelCase(data)` でレスポンスを camelCase 化してから state にセット
  - 更新系（`regular_journal_entries` 等）: `toSnakeCase(entry)` で送信直前に snake_case 化
  - `journal_entries` / `schedule_events` は個別フィールドを手動でオブジェクト化しており、`toSnakeCase` を経由しない箇所もある（`financialStore.ts` の `addJournalEntry` 等）
- **ID プレフィックス**

  | リソース | プレフィックス | 生成箇所 |
  |---------|--------------|---------|
  | 勘定科目 | `jacc_` | `addJournalAccount`（`crypto.randomUUID()`） |
  | 仕訳エントリー | `je_` | `addJournalEntry`, `insertRecurringExecution` |
  | 定期仕訳 | `reg_` | `addRegularJournalEntry` |
  | スケジュールイベント | `event_` | `eventsStore.addEvent` |
  | 支出目標 | `goal_` | `addGoal` |

---

## テーブル直接アクセス（PostgREST）一覧

| テーブル | 操作 | 呼び出し元アクション | フィルタ | ソート順 |
|---------|------|---------------------|---------|---------|
| `journal_accounts` | select | `getJournalAccounts` | `user_id = :userId` | `category` 昇順 → `name` 昇順 |
| `journal_accounts` | insert | `addJournalAccount` | — | — |
| `journal_accounts` | update | `updateJournalAccount` | `id`, `user_id` | — |
| `journal_accounts` | delete | `deleteJournalAccount` | `id`, `user_id` | — |
| `journal_entries` | insert | `insertRecurringExecution`（定期取引実行時の内部ヘルパー） | — | — |
| `journal_entries` | update | `updateJournalEntry` | `id`, `user_id` | — |
| `journal_entries` | delete | `deleteJournalEntry` | `id`, `user_id` | — |
| `regular_journal_entries` | select | `getRegularJournalEntries`, `executeRegularJournalEntry`（単票取得）, `executeDueRegularJournalEntries`（全件取得） | `user_id = :userId`（単票取得は `id` も指定） | `start_date` 降順（一覧取得時） |
| `regular_journal_entries` | insert | `addRegularJournalEntry` | — | — |
| `regular_journal_entries` | update | `updateRegularJournalEntry`, `insertRecurringExecution`（`last_executed_date` 更新） | `id`, `user_id` | — |
| `regular_journal_entries` | delete | `deleteRegularJournalEntry` | `id`, `user_id` | — |
| `schedule_events` | select | `fetchEvents` | `user_id = :userId` | — |
| `schedule_events` | insert | `addEvent` | — | — |
| `schedule_events` | update | `updateEvent` | `event_id`, `user_id` | — |
| `schedule_events` | delete | `deleteEvent` | `event_id`, `user_id` | — |
| `goals` | select | `getGoals` | `user_id = :userId` | — |
| `goals` | insert | `addGoal` | — | — |
| `goals` | update | `updateGoal` | `id`, `user_id` | — |
| `goals` | delete | `deleteGoal` | `id`, `user_id` | — |

新規仕訳エントリーの作成（`journal_entries` への insert）は PostgREST 直接ではなく **RPC `create_journal_entry`** を経由する（残高更新をアトミックに行うため）。

---

## VIEW

### `v_journal_entries_for_calendar`

カレンダー表示用の VIEW。`journal_entries` に借方・貸方それぞれの勘定科目名・カテゴリを事前 JOIN 済みで、クライアント側で `journalAccounts.find()` する必要がない。

| 呼び出し元 | フィルタ | ソート順 |
|-----------|---------|---------|
| `getCalendarJournalEntries(startDate, endDate)` | `user_id`, `date >= startDate`, `date <= endDate` | `date` 降順 |

対応する型は `packages/shared/src/types/common.ts` の `CalendarJournalEntry`（`debitAccountName`, `debitAccountCategory`, `creditAccountName`, `creditAccountCategory` を含む）。

---

## RPC 関数一覧

### `create_journal_entry(entry_data jsonb, update_balances boolean)`

仕訳エントリーを作成し、`update_balances = true` の場合は勘定科目の残高もあわせて更新する。

- **引数**:
  - `entry_data`: `{ id, date, description, debitAccountId, creditAccountId, amount, user_id }`（camelCase のまま jsonb で渡す）
  - `update_balances`: 常に `true` を渡している
- **呼び出し元**: `financialStore.addJournalEntry`
- **使用例**:
  ```ts
  const { error } = await supabase.rpc('create_journal_entry', {
    entry_data: {
      id: `je_${crypto.randomUUID()}`,
      date, description, debitAccountId, creditAccountId, amount, user_id: userId,
    },
    update_balances: true,
  });
  ```

### `fn_balance_sheet(p_user_id, p_end_date)`

指定基準日時点の貸借対照表用の勘定科目別集計を返す。

- **引数**: `p_user_id: string`, `p_end_date: string`（`YYYY-MM-DD`。省略時は `todayLocalString()`）
- **戻り値行**: `user_id`, `account_id`, `category`, `name`, `sum_amount`（フロントでは `toCamelCase` 後に型 `BalanceSheetView` として扱う）
- **呼び出し元**: `financialStore.getBalanceSheetView`
- **使用例**:
  ```ts
  const { data } = await supabase.rpc('fn_balance_sheet', {
    p_end_date: asOfDateStr,
    p_user_id: userId,
  });
  ```

### `fn_profit_loss(p_user_id, p_start_date, p_end_date)`

指定期間の損益計算書用の勘定科目別集計を返す。

- **引数**: `p_user_id: string`, `p_start_date: string`（省略時は当月1日）, `p_end_date: string`（省略時は本日）
- **戻り値行**: `user_id`, `account_id`, `category`, `name`, `sum_amount`（型 `ProfitLossView`）
- **呼び出し元**: `financialStore.getProfitLossStatementView`
- **使用例**:
  ```ts
  const { data } = await supabase.rpc('fn_profit_loss', {
    p_start_date: startDate || defaultStart,
    p_end_date: endDate || defaultEnd,
    p_user_id: userId,
  });
  ```

---

## ストアアクション一覧

すべてフロント向けの公開 API（Zustand フック）。共通して `useAuthStore.getState().userId` が無い場合は空配列/何もせず return する。エラーは各アクション内で `try/catch` し `console.error` に出力、state は据え置き（呼び出し元へは例外を投げ直さない）——ただし `executeDueRegularJournalEntries` は外側の catch で再 throw する。

### financialStore（`packages/shared/src/stores/financialStore.ts`）

| アクション | シグネチャ | 処理概要 | エラー時挙動 |
|-----------|-----------|---------|-------------|
| `getJournalAccounts` | `() => Promise<JournalAccount[]>` | `journal_accounts` を取得し state に反映 | `console.error` して現在の state を返す |
| `getCalendarJournalEntries` | `(startDate, endDate) => Promise<CalendarJournalEntry[]>` | VIEW `v_journal_entries_for_calendar` を期間指定で取得（state には保存しない） | `console.error` して `[]` を返す |
| `getRegularJournalEntries` | `() => Promise<RecurringTransaction[]>` | `regular_journal_entries` を取得し state に反映 | `console.error` して現在の state を返す |
| `getBalanceSheetView` | `(asOfDate?) => Promise<BalanceSheetView[]>` | RPC `fn_balance_sheet` 呼び出し | `console.error` して `[]` |
| `getProfitLossStatementView` | `(startDate?, endDate?) => Promise<ProfitLossView[]>` | RPC `fn_profit_loss` 呼び出し | `console.error` して `[]` |
| `addJournalAccount` | `(account: Omit<JournalAccount,'id'>) => Promise<void>` | `jacc_` ID 発行 → insert → state に追加 | `console.error`（呼び出し元には伝播しない） |
| `addJournalEntry` | `(entry: Omit<JournalEntry,'id'>) => Promise<void>` | `je_` ID 発行 → RPC `create_journal_entry` → state に追加 | 同上 |
| `addRegularJournalEntry` | `(entry: Omit<RecurringTransaction,'id'>) => Promise<void>` | `reg_` ID 発行 → `toSnakeCase` → insert → state に追加 | 同上 |
| `updateJournalAccount` | `(account: JournalAccount) => Promise<void>` | `name`/`category` を update → state を置換 | 同上 |
| `updateJournalEntry` | `(entry: JournalEntry) => Promise<void>` | 全フィールド update（`amount` は `parseFloat`） | 同上 |
| `updateRegularJournalEntry` | `(entry: RecurringTransaction) => Promise<void>` | `toSnakeCase(entry)` を丸ごと update | 同上 |
| `deleteJournalAccount` / `deleteJournalEntry` / `deleteRegularJournalEntry` | `(entity) => Promise<void>` | delete → state から filter で除去 | 同上 |
| `getGoals` | `() => Promise<Goal[]>` | `goals` を取得し state に反映 | `console.error` して現在の state を返す |
| `addGoal` | `(goal: Omit<Goal,'id'>) => Promise<void>` | `goal_` ID 発行 → `toSnakeCase` → insert → state に追加 | `console.error`（呼び出し元には伝播しない） |
| `updateGoal` | `(goal: Goal) => Promise<void>` | `amount` を update → state を置換 | 同上 |
| `deleteGoal` | `(goal: Goal) => Promise<void>` | delete → state から filter で除去 | 同上 |
| `executeRegularJournalEntry` | `(entry: RecurringTransaction) => Promise<void>` | 定期取引を1件手動実行（下記参照）。実行後に `getJournalAccounts` / `getRegularJournalEntries` を呼び直す | `console.error`（同日重複実行は内部で `throw` するが catch されて握りつぶされる） |
| `executeDueRegularJournalEntries` | `() => Promise<{executed:number, details:any[]}>` | 全定期取引を走査し当日実行対象を一括実行 | エラーを再 throw する（呼び出し元で catch が必要） |

### eventsStore（`packages/shared/src/stores/eventsStore.ts`）

| アクション | シグネチャ | 処理概要 | エラー時挙動 |
|-----------|-----------|---------|-------------|
| `fetchEvents` | `() => Promise<void>` | `schedule_events` を `user_id` で取得し state を置換 | `console.error` |
| `addEvent` | `(event: Omit<ScheduleEvent,'eventId'\|'createdAt'>) => Promise<void>` | `event_` ID 発行、`created_at` をクライアントで発行し insert → state に追加 | `console.error` |
| `updateEvent` | `(event: ScheduleEvent) => Promise<void>` | `event_id` + `user_id` で update → state を置換 | `console.error` |
| `deleteEvent` | `(eventId: string) => Promise<void>` | `event_id` + `user_id` で delete → state から filter | `console.error` の上で再 throw（呼び出し元で catch している） |

### authStore（`packages/shared/src/stores/authStore.ts`）

| アクション | シグネチャ | 処理概要 |
|-----------|-----------|---------|
| `setSession` | `(session: Session \| null) => void` | `session` と `userId`（`session?.user?.id`）を更新 |
| `refreshSession` | `() => Promise<Session \| null>` | `supabase.auth.getSession()` を呼び `setSession` に反映、取得したセッションを返す |
| `signOut` | `() => Promise<void>` | `supabase.auth.signOut()` の上で `session`/`userId` を `null` にリセット |

`useAuthStore` は `client: SupabaseClient` もそのまま公開しており、`Auth`（`@supabase/auth-ui-react`）コンポーネントに直接渡している（desktop の `App.tsx`、mobile の `LoginScreen.tsx`）。

---

## 定期取引の実行仕様

判定ロジックの実体は `packages/shared/src/utils/recurrence.ts` の `isExecutionDate` / `getNextExecutionDate` に一本化されている（desktop・mobile 双方の UI、および `executeDueRegularJournalEntries` から共通利用）。

### `isExecutionDate(t: RecurringTransaction, date = new Date()): boolean`

1. `startDate` / `endDate` の範囲外なら `false`
2. `frequency` ごとの判定:
   - `daily`: 常に `true`
   - `weekly`: `xxxFlgOfWeek` で対象曜日かどうかを判定。`publicHolidayExFlgOfWeek` が `true` の場合、土日は強制的に `false`（祝日除外フラグ）
   - `monthly`: `dateOfMonth` を当月の最終日で `Math.min` して clamp（例: 31日設定 × 2月 → その月の月末日）した上で `adjustWeekendDate(targetDate, holidayDivOfMonth)` を適用し、結果が対象日と一致するか
   - `yearly`: `dateOfYear` は `MM-DD` と `YYYY-MM-DD` の両形式を `parseDateOfYear` でパースし、月・日を `adjustWeekendDate` で調整して一致判定
   - `free`: 常に `false`（手動実行のみ）

### `getNextExecutionDate(t, today = new Date()): Date | undefined`

- `endDate` を過ぎていれば `undefined`
- 本日が実行日かつ `lastExecutedDate !== 本日` なら本日を返す（**同日重複実行防止**の判定はここと `executeRegularJournalEntry` / `executeDueRegularJournalEntries` の両方で行われる）
- `weekly` は今週の残り曜日→来週以降を探索（最大4週間先まで）
- `monthly` は当月の調整後日付が本日より前なら翌月にロールオーバー
- `yearly` は翌年の調整後日付を返す
- `daily` / `free` は `undefined`（次回実行日の概念がない）

### 同日重複実行防止

- `executeRegularJournalEntry`: DB から最新の `regular_journal_entries` 行を取得し、`last_executed_date === today` なら `Error('Entry already executed today')` を throw（呼び出し元では catch されログのみ）
- `executeDueRegularJournalEntries`: 全件走査時に `entry.last_executed_date === todayStr` の行は最初からスキップ
- 実行成功時は共通ヘルパー `insertRecurringExecution`（`financialStore.ts` 内）が `journal_entries` へ insert し、同一トランザクションではないが直後に `regular_journal_entries.last_executed_date` を本日日付で更新する

### 呼び出し元 UI

- desktop: `RecurringTransactionManager` がマウント時とその後10分間隔で `executeDueRegularJournalEntries` を自動実行
- mobile: `RecurringTransactionCard` の「期限到来分を実行」ボタンから手動でトリガー（自動ポーリングはなし）
