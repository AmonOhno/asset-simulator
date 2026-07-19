# UI仕様書 - 会計＆資産シミュレーター

## 目次
- [1. 画面全体像](#1-画面全体像)
- [2. デスクトップ版](#2-デスクトップ版)
- [3. モバイル版](#3-モバイル版)
- [4. フォームバリデーション仕様](#4-フォームバリデーション仕様)
- [5. データフロー](#5-データフロー)
- [6. 期間セレクター仕様](#6-期間セレクター仕様)

---

## 1. 画面全体像

`client/src/main.tsx` がエントリーポイント。`client/src/utils/deviceDetect.ts` の `isMobileDevice()` で端末を判定し、`React.lazy` で該当 UI を読み込む。

```
client/src/main.tsx
├─ isMobileDevice() === false → lazy(() => import('./DesktopApp'))  → @web/App (desktop/src/App.tsx)
└─ isMobileDevice() === true  → lazy(() => import('@mobile/App'))   → mobile/app/src/App.tsx
```

`isMobileDevice()` の判定ロジック（`client/src/utils/deviceDetect.ts`）:
- UA に `Mobi|Android|iPhone|iPod` を含み、かつ `iPad` を含まない → モバイル扱い
- iPad は常にデスクトップ UI 扱い（タブレット）
- Safari の「デスクトップ用サイトを表示」で UA が書き換わるケースのフォールバックとして、`navigator.maxTouchPoints > 1 && window.screen.width <= 430` （iPhone 14 Pro Max 相当以下の幅）もモバイル判定に含める

`client/src/DesktopApp.tsx` は Bootstrap CSS を読み込んだ上で `@web/App` を re-export するラッパー。

---

## 2. デスクトップ版

エントリー: `desktop/src/App.tsx`。Bootstrap ベースの UI。

### 2.1 タブ構成

| タブ ID | 表示名 | 内容 |
|--------|-------|------|
| `transactions` | 取引入力 | `JournalEntryForm` + `MainCalendar` |
| `JournalDashboard` | ダッシュボード | `JournalDashboard`（BS/PL） |
| `recurring` | 定期取引 | `RecurringTransactionManager` |
| `masters` | 勘定科目管理 | `JournalAccountManager` |
| `events` | イベント入力 | `EventScheduleForm` + `EventScheduleManager` |

`transactions` と `recurring` は同じドロップダウングループ（`transactionGroupActive`）に属し、ナビゲーションの見た目上は1つのボタン＋ドロップダウンとして表示される。

### 2.2 コンポーネントツリー

```
App (desktop/src/App.tsx)
├─ [transactions] JournalEntryForm, MainCalendar
│    └─ MainCalendar → JournalEntriesModal（仕訳編集モーダル）
├─ [JournalDashboard] JournalDashboard
│    └─ DateRangePicker（common/DateRangePicker.tsx）
├─ [recurring] RecurringTransactionManager
│    └─ RecurringTransactionFormModal
├─ [masters] JournalAccountManager
└─ [events] EventScheduleForm, EventScheduleManager
     └─ EventScheduleManager → EventScheduleForm（編集モーダル内で再利用）
```

### 2.3 各コンポーネントの責務

| コンポーネント | ファイル | 責務 | 使用するストアアクション |
|---------------|---------|------|------------------------|
| `App` | `src/App.tsx` | 認証状態監視・タブ切り替え・初回データ取得 | `getJournalAccounts`, `getRegularJournalEntries`, `fetchEvents` |
| `JournalEntryForm` | `components/journal/JournalEntryForm.tsx` | 仕訳の新規登録フォーム。カードヘッダークリックで折りたたみ。「よく使う入力」サジェスト（直近仕訳の頻出セット）をタップするとフォームに反映 | `addJournalEntry`, `getFrequentJournalEntrySets`（`journalAccounts` を購読） |
| `MainCalendar` | `components/MainCalendar.tsx` | `react-calendar` による月間カレンダー。日別の仕訳・イベント表示、借方/貸方フィルタ、費用/収益サマリー | `getCalendarJournalEntries`（月が変わるたびに再取得）, `updateJournalEntry`（編集モーダル保存時） |
| `JournalEntriesModal` | `components/journal/JournalEntriesModal.tsx` | `MainCalendar` から開く仕訳編集モーダル（フィールド編集のみ、保存は呼び出し元） | なし（props 経由の callback） |
| `JournalDashboard` | `components/journal/JournalDashboard.tsx` | BS/PL の表示。期間・基準日は `localStorage` に `userId` ごとに永続化 | `getBalanceSheetView`, `getProfitLossStatementView` |
| `DateRangePicker` | `components/common/DateRangePicker.tsx` | 週/月/年/カスタムのプリセット選択 UI。shared の `computePeriodRange`/`shiftPeriodRange` を呼ぶ | ストア未使用（shared/utils のみ） |
| `RecurringTransactionManager` | `components/journal/RecurringTransactionManager.tsx` | 定期取引の一覧・フィルタ・ソート・実行。マウント時+10分間隔で期限到来分を自動実行 | `getRegularJournalEntries`, `addRegularJournalEntry`, `updateRegularJournalEntry`, `deleteRegularJournalEntry`, `executeRegularJournalEntry`, `executeDueRegularJournalEntries` |
| `RecurringTransactionFormModal` | `components/journal/RecurringTransactionFormModal.tsx` | 定期取引の新規作成・編集用モーダル（頻度に応じて入力項目が切り替わる） | なし（`RecurringTransactionManager` から `formData`/`onChange`/`onSave` を受け取る） |
| `JournalAccountManager` | `components/journal/JournalAccountManager.tsx` | 勘定科目の追加・編集一覧。`isSystemAccount()`（`acc_`/`card_` プレフィックス）はカテゴリ編集を禁止 | `addJournalAccount`, `updateJournalAccount`, `getJournalAccounts` |
| `EventScheduleForm` | `components/event/EventScheduleForm.tsx` | イベントの新規登録・編集フォーム（`editingEvent` props があれば編集モード） | `addEvent`（新規時のみ。編集時は親の `onSave` 経由で `updateEvent`） |
| `EventScheduleManager` | `components/event/EventScheduleManager.tsx` | イベント一覧（すべて/今後/過去フィルタ）、編集・削除 | `updateEvent`, `deleteEvent`（`events` を購読） |

### 2.4 その他

- `desktop/src/hooks/useScrollToTop.tsx`: `JournalAccountManager` の編集開始時に `#journal-account-manager .card-body` を先頭へスクロールするための共通フック
- `desktop/src/App.test.tsx`: ヘッダー文言（「会計＆資産シミュレーター」）が表示されることのみを確認するスモークテスト

---

## 3. モバイル版

エントリー: `mobile/app/src/App.tsx`。インラインスタイル（`CSSProperties`）ベースの UI で、下部タブバー形式。

### 3.1 タブ構成

| タブ ID | 表示名 | 内容 |
|--------|-------|------|
| `transaction` | 取引 | `CalendarCard` + 取引入力/編集ダイアログ（`TransactionEntryCard`） + `GoalCard`（支出目標） |
| `pl-bs` | PL/BS | `PeriodSelector`（期間指定）+ `PanelButton` × 2（純利益/純資産）→ 展開で `ProfitLossStatementCard` / `BalanceSheetCard` + `GoalCard`（支出目標） |
| `recurring` | 定期取引 | `RecurringTransactionCard` |
| `accounts` | 勘定科目 | `AccountMasterCard` |

未ログイン時は `LoginScreen`（Supabase Auth UI、Google/GitHub プロバイダ）を表示。

### 3.2 各カードの責務

| コンポーネント | ファイル | 責務 | 使用するストアアクション |
|---------------|---------|------|------------------------|
| `App` | `mobile/app/src/App.tsx` | 認証監視・タブ切り替え・PL/BS 期間の一括管理・取引入力/編集ダイアログの開閉 | `getJournalAccounts`, `getRegularJournalEntries`, `fetchEvents`, `getProfitLossStatementView`, `getBalanceSheetView` |
| `LoginScreen` | `LoginScreen.tsx` | 未ログイン時のログイン画面（Supabase Auth UI） | なし（`useAuthStore` の `client` のみ） |
| `CalendarCard` | `CalendarCard.tsx` | 月表示のカレンダー。日付タップで選択、ダブルタップで取引入力ダイアログを開く。選択日の取引一覧・編集/削除 | `getCalendarJournalEntries`, `deleteJournalEntry` |
| `TransactionEntryCard` | `TransactionEntryCard.tsx` | 取引の新規登録／編集（`entry` props の有無でモード切替）。新規登録モードでは「よく使う入力」サジェスト（直近仕訳の頻出セット）をダイアログ上部に表示し、タップで摘要・借方・貸方・金額をフォームに反映 | `addJournalEntry`, `updateJournalEntry`, `getJournalAccounts`（残高反映のため再取得）, `getFrequentJournalEntrySets`（新規モードのみ） |
| `ProfitLossStatementCard` | `ProfitLossStatementCard.tsx` | 収益・費用の明細サマリーリスト（`PeriodSelector` 内包） | なし（`rows` は `App` から props で受け取る） |
| `BalanceSheetCard` | `BalanceSheetCard.tsx` | 資産・負債・純資産の明細サマリーリスト（基準日プリセット: 今日/今月末/先月末） | なし（`rows` は props） |
| `RecurringTransactionCard` | `RecurringTransactionCard.tsx` | 定期取引の一覧・追加（ダイアログ）・実行・削除・期限到来分一括実行 | `addRegularJournalEntry`, `deleteRegularJournalEntry`, `executeRegularJournalEntry`, `executeDueRegularJournalEntries` |
| `AccountMasterCard` | `AccountMasterCard.tsx` | 勘定科目の追加・一覧・**削除**（desktop の勘定科目管理は編集のみで削除なし） | `addJournalAccount`, `deleteJournalAccount` |
| `GoalCard` | `GoalCard.tsx` | 費用科目ごと・期間（日次/月次）ごとの支出目標の設定（ダイアログ、同一科目・期間は金額を上書き）・一覧・進捗表示（当日/当月の実績支出との比較バー）・削除。`transaction` タブと `pl-bs` タブの両方から利用可能 | `getGoals`, `addGoal`, `updateGoal`, `deleteGoal`, `getProfitLossStatementView`（実績取得） |

モバイル版には勘定科目の「編集」機能はない（追加・削除のみ）。desktop 版には「削除」機能がない（追加・編集のみ）。

### 3.3 コンポーネントライブラリ（mobile/components、Storybook 対象）

`mobile/.storybook/` に各コンポーネントの `.stories.tsx` があり、Storybook でカタログ表示・確認できる。

| コンポーネント | ファイル | props 概要 |
|---------------|---------|-----------|
| `Card` / `CardBodyHead` / `CardBodyMain` | `Card.tsx` | `isExpanded`, `onToggle`, `title`, `subInfo?`, `maxHeight?`。折りたたみ可能なカードコンテナ |
| `CommonButton` | `CommonButton.tsx` | `label`, `sizeVariant?`(S/M/L/LL/Full), `colorVariant?`(primary/secondary), `fontSize?`(S/M/L), `icon?`, `onClick?` |
| `DataGrid<T>` | `DataGrid.tsx` | `data: T[]`, `columns: {label,key,width?,align?}[]`, `colorVariant?`(blue/red/gray)。ジェネリックなテーブル表示 |
| `DateInput` | `DateInput.tsx` | `value`, `onChange`, `onBlur?`, `readOnly?`, `sizeVariant?`(S/M/L/Full), `fontSize?`。`min="2000-01-01"` `max="2100-12-31"` 固定 |
| `Dialog` | `Dialog.tsx` | `isOpen`, `onClose`, `title?`, `children?`。`createPortal` で `document.body` に描画、Esc キーで閉じる |
| `NumericInput` | `NumericInput.tsx` | `value`, `unit?`, `min?`, `max?`, `error?`, `placeholder?`, `allowNegative?`（±ボタン表示）, `onBlur?`, `sizeVariant?`, `fontSize?`。ローカル文字列 state を持ち `onBlur` でのみ確定 |
| `PanelButton` | `PanelButton.tsx` | `title`, `value`, `onClick`, `subText?`。金額サマリーの大きなボタン（純利益/純資産パネルなどで使用） |
| `PeriodSelector` | `PeriodSelector.tsx` | `range: PeriodRange`, `onChange`, `defaultPreset?`, `defaultSettings?`。週/月/年/カスタムの期間選択（shared の `computePeriodRange`/`shiftPeriodRange` を内部使用） |
| `SelectInput` | `SelectInput.tsx` | `options: {label,value}[]`, `value`, `onChange`, `sizeVariant?`, `fontSize?` |
| `TextInput` | `TextInput.tsx` | `placeholder`, `value`, `onChange?`, `onBlur?`, `sizeVariant?`, `fontSize?` |

`mobile/components/periodSelector.utils.ts` は `packages/shared/src/utils/period.ts` を re-export するだけのファイル（ロジックの実体は shared 側の一箇所に集約）。

---

## 4. フォームバリデーション仕様

コード上の実際の `validate`/`alert` に基づく（推測ではなくソース確認済み）。

### 4.1 仕訳入力

| フォーム | ファイル | 必須項目 | 実装 |
|---------|---------|---------|------|
| desktop `JournalEntryForm` | `desktop/src/components/journal/JournalEntryForm.tsx` | 日付・摘要・借方勘定科目・貸方勘定科目・金額 | `handleSubmit` で全項目の truthy チェックのみ。不足時は `alert('すべての項目を入力してください。')` |
| mobile `TransactionEntryCard` | `mobile/app/src/TransactionEntryCard.tsx` | 日付・摘要・借方勘定科目・貸方勘定科目（借方と異なること）・金額（0以外） | `validate()` が項目ごとに個別の `alert` を出す（例:「貸方勘定科目を選択してください（借方と異なる科目）」「金額を入力してください（0 以外）」） |

desktop 版は借方・貸方が同一科目でも登録をブロックしない点がモバイル版と異なる。

### 4.2 定期取引

| フォーム | 必須/制約 | 実装 |
|---------|----------|------|
| desktop `RecurringTransactionManager`/`RecurringTransactionFormModal` | `name`, `debitAccountId`, `creditAccountId` が必須 | `handleSave` で `alert('必須項目を入力してください')` |
| mobile `RecurringTransactionCard` | 取引名称必須、借方必須、貸方必須（借方と異なる科目）、金額 > 0、`monthly` は `dateOfMonth` 1〜31、`yearly` は `dateOfYear` が `MM-DD` 正規表現 (`/^\d{2}-\d{2}$/`) に一致 | `addRecurring()` が項目ごとに個別の `alert` |

### 4.3 イベント入力

`desktop/src/components/event/EventScheduleForm.tsx` の `handleSubmit`:

- `title`, `startDate`, `endDate` は必須（いずれか欠落で `alert('必須項目を入力してください。')`）
- `startDate > endDate` はエラー（`alert('開始日は終了日より前である必要があります。')`）
- `title.length > 100` はエラー（`alert('タイトルは100文字以内である必要があります。')`。input 側も `maxLength={100}` で制限）
- `allDayFlg === false` かつ（`startTime` または `endTime` が空）はエラー（`alert('終日イベントには開始時間と終了時間の設定ができません。')` — メッセージは終日/時間指定が逆転しているが実装上のロジックは「時間指定モードなのに時刻未入力」を指す）
- `allDayFlg === true` かつ（`startTime` または `endTime` が入力済み）はエラー（`alert('時間指定のイベントには開始時間と終了時間が必要です。')` — 同様にメッセージ文言と実際の条件が逆になっている点に注意）

モバイル版には現状イベント入力 UI（`EventScheduleForm` 相当）は存在しない。

### 4.4 勘定科目

| フォーム | 必須/制約 | 実装 |
|---------|----------|------|
| desktop `JournalAccountManager` | `name` は `required`（HTML バリデーションのみ）。編集時、`isSystemAccount(id)`（`acc_`/`card_` プレフィックス）はカテゴリ `<select>` を `disabled` にする | フォームの JS 側バリデーションはなし |
| mobile `AccountMasterCard` | `name` 必須 | `addAccount()` で `alert('勘定科目名を入力してください')` |

---

## 5. データフロー

### 5.1 ストア構成

`packages/shared/src/stores/` の Zustand ストア（`@asset-simulator/shared` からインポート）:

| ストア | 主な state | 主なアクション |
|-------|-----------|---------------|
| `useFinancialStore` | `journalAccounts`, `journalEntries`, `regularJournalEntries` | 詳細は [`docs/api/specification.md`](../api/specification.md#ストアアクション一覧) |
| `useEventsStore` | `events` | `fetchEvents`, `addEvent`, `updateEvent`, `deleteEvent` |
| `useAuthStore` | `session`, `userId`, `client` | `setSession`, `refreshSession`, `signOut` |

`useFinancialStore` は `persist` ミドルウェアで `localStorage`（キー `financial-store`）に永続化される。

### 5.2 リフレッシュルール

**ミューテーション後は変更したリソースのアクションだけを呼ぶ。** 広範囲な「全データ再取得」関数は存在しない。

- 仕訳登録・更新後: `getJournalAccounts()`（残高が変わるため）を呼ぶ実装が多い（例: mobile `TransactionEntryCard`）
- 定期取引実行後: `executeRegularJournalEntry`/`executeDueRegularJournalEntries` の内部で `getJournalAccounts()` + `getRegularJournalEntries()` を呼び直す
- イベント CRUD 後: `addEvent`/`updateEvent`/`deleteEvent` が自身で state を更新するため、`fetchEvents()` の再呼び出しは不要（コード内コメントにも明記）

### 5.3 初回データ取得（desktop / mobile 共通パターン）

```
App
├─ useEffect（認証監視）
│   └─ refreshSession() → setSession() / onAuthStateChange → setSession()
├─ useEffect（session 依存, ref で一度だけ）
│   └─ getJournalAccounts() + getRegularJournalEntries()（初回のみ）
│   └─ fetchEvents()（毎回）
└─ 各タブ/カード
    └─ ストアの state を購読、必要に応じて自身で個別データ（カレンダー月別データ・BS/PL 等）を取得
```

- desktop: `activeTab` が `calendar`/`events` のときは `fetchEvents()` を再実行（実際のタブ ID は `transactions`/`events` などのため、この判定は現状ヒットしにくい実装になっている点に留意）
- mobile: `entriesVersion`（取引の登録・更新・削除でインクリメント）を依存配列に含めることで、PL/BS の再取得とカレンダーの再取得をトリガーする

### 5.4 仕訳入力フロー（例: mobile）

```
TransactionEntryCard.registerEntry()
└─ addJournalEntry()  … RPC create_journal_entry
   └─ getJournalAccounts()  … 残高反映
      └─ onEntryAdded?.()  … App の entriesVersion をインクリメント
         └─ CalendarCard / PL・BS カードが再取得・再描画
```

---

## 6. 期間セレクター仕様

実体は `packages/shared/src/utils/period.ts` に一本化されている（`mobile/components/periodSelector.utils.ts` は re-export のみ）。desktop の `DateRangePicker`、mobile の `PeriodSelector` は共にこの関数を呼び出す。

### 6.1 設定値（`PeriodSettings`）

| フィールド | 意味 | デフォルト |
|-----------|------|-----------|
| `startDayOfWeek` | 週プリセットの開始曜日（0:日 〜 6:土） | 1（月曜） |
| `startDayOfMonth` | 月プリセットの開始日（1〜31） | 25 |
| `holidayAdjustment` | 月/年プリセットの休日ずらし（`'none'`/`'before'`/`'after'`） | `'none'`（`DEFAULT_PERIOD_SETTINGS` 上。desktop `DateRangePicker` の初期 UI 値は `'before'`） |
| `startMonth` | 年プリセットの開始月（1〜12） | 1 |
| `startMonthDay` | 年プリセットの開始日（1〜31） | 1 |

### 6.2 プリセット計算（`computePeriodRange`）

- **week**: `today` から `startDayOfWeek` 基準で当該週の開始日を逆算し、+6日を終了日とする
- **month**: 当月の `startDayOfMonth` 日を仮の開始日とし、それが `today` より未来なら前月にずらす。**終了日は「翌期間の（休日調整後）開始日の前日」**として計算し、開始日自体も同じ `holidayAdjustment` で調整する（#106 修正: 月単位の休日ずらしで期間終了日が次期間開始日に重なる不具合の修正。詳細は下記6.4）
- **year**: `startMonth`/`startMonthDay` を仮の開始日とし、`today` より未来なら前年にずらす。終了日は翌年の同日の前日
- **custom**: `null` を返す（呼び出し側は既存の値を維持）

### 6.3 期間移動（`shiftPeriodRange`）

`current`（現在の期間）と `direction`（`'prev'`/`'next'`）を受け取り、隣接する期間を計算する。month の場合、`currentStart`（調整後の開始日）から `settings.startDayOfMonth` を使って調整前の基準日を再構成し、月をオフセットしてから改めて休日調整をかける（調整後の日付をそのまま月シフトすると誤差が生じるための対応）。

### 6.4 月次開始日 + 休日ずらしの重複・欠落防止（Issue #106）

修正前は月の終了日を「次の開始日と同じ日」など単純な計算にしていたため、休日調整によって隣接する期間が重複したり1日欠落したりする不具合があった。

修正後のロジック（`computePeriodRange`/`shiftPeriodRange` 共通）:

1. 翌期間の開始日（調整前）を計算
2. その日付に `holidayAdjustment` を適用（＝翌期間の実際の開始日）
3. その **前日** を今期間の終了日とする
4. 今期間の開始日にも同じ `holidayAdjustment` を適用する

これにより「今期間の終了日 + 1日 = 次期間の開始日」が常に成立し、重複・欠落が起きない。`packages/shared/src/utils/__tests__/period.test.ts` に `#106 回帰テスト` として、`startDayOfMonth: 25`・`holidayAdjustment: 'before'/'after'` の両パターンで境界日が連続することを検証するテストがある。

### 6.5 UI 差異

- desktop `DateRangePicker`: プリセットは `'1-week'`/`'1-month'`/`'1-year'`/`'custom'`という別名で保持し、内部で `PeriodPreset`（`'week'`/`'month'`/`'year'`/`'custom'`）にマッピングしてから shared 関数を呼ぶ
- mobile `PeriodSelector`: `PeriodPreset` をそのまま state に持つ。前後移動ボタンは custom 以外で表示

---

## 更新日時

最終更新: 2026-07-03
