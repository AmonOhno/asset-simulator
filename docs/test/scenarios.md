# テストシナリオ

## 1. 自動テスト

### 1.1 packages/shared のユニットテスト

`packages/shared/src/utils/__tests__/` に Jest（`ts-jest` + `jsdom`）で実装。

実行方法:
```
npm test --workspace=packages/shared
```

#### dateUtils.test.ts

| 対象関数 | 観点 |
|---------|------|
| `formatDateLocal` | ローカル日時から `YYYY-MM-DD` を生成（1桁の月日を0埋め） |
| `todayLocalString` | `formatDateLocal(new Date())` と一致すること |
| `adjustWeekendDate` | 土曜 `before` は -1日、`after` は +2日／日曜 `before` は -2日、`after` は +1日／`none` は無調整／平日はいずれの `adj` でも無調整／引数の `Date` を破壊的に変更しないこと |

#### period.test.ts

基準日 2026-07-03（金曜）で以下を検証。

| 対象関数 | 観点 |
|---------|------|
| `computePeriodRange('week', ...)` | 設定した `startDayOfWeek`（月曜）基準で週範囲を算出 |
| `computePeriodRange('month', ...)` | `startDayOfMonth`（25日）が本日より未来なら前月開始にフォールバックすること |
| `computePeriodRange('year', ...)` | `startMonth`/`startMonthDay` 基準の年範囲 |
| `computePeriodRange('custom', ...)` | `null` を返す |
| **#106 回帰**: `holidayAdjustment: 'before'` | 25日開始・休日前倒し設定で、現在期間の終了日の翌日が次期間の開始日と一致すること（重複・欠落がない） |
| **#106 回帰**: `holidayAdjustment: 'after'` | 同上（前後両方向 `shiftPeriodRange` の prev/next で検証） |
| `shiftPeriodRange` | week/month/year それぞれで `next` → `prev` の往復が元の範囲に戻ること（round-trip）。`custom` は `null` |

#### recurrence.test.ts

基準日 2026-07-03（金曜）で以下を検証。

| 対象関数 | 観点 |
|---------|------|
| `isExecutionDate` daily | 常に `true` |
| `isExecutionDate` weekly | 曜日フラグが立っている日のみ `true`／`publicHolidayExFlgOfWeek` で土日を除外できること |
| `isExecutionDate` monthly | `dateOfMonth` が月末日を超える場合に当月末日へ clamp されること（例: 6月30日に対し `dateOfMonth: 31`）／`holidayDivOfMonth: 'before'` で休日調整されること／`dateOfMonth` 未設定は `false` |
| `isExecutionDate` yearly | `dateOfYear` が `MM-DD` と `YYYY-MM-DD` の両形式を受け付けること／空文字は `false` |
| `isExecutionDate` free | 常に `false` |
| `isExecutionDate` 範囲チェック | `startDate` 前・`endDate` 後は `false`、範囲内は `true` |
| `getNextExecutionDate` | `endDate` 経過後は `undefined`／本日が実行日かつ未実行なら本日を返す／`lastExecutedDate` が本日なら次回（翌週等）を返す（同日重複実行防止）／weekly は今週残り日→来週以降を探索／monthly は当月内が未来ならその日、過ぎていれば翌月へロールオーバー／yearly は翌年の日付／free・daily は `undefined` |

### 1.2 desktop のスモークテスト

`desktop/src/App.test.tsx`（React Testing Library）。ヘッダー文言「会計＆資産シミュレーター」が描画されることのみを確認する簡易テスト。

実行方法:
```
npm run test --workspace=desktop -- --watchAll=false
```

---

## 2. 手動テストシナリオ

Given/When/Then 形式。特記のない限り desktop・mobile 双方で確認する。

### 2.1 認証

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 未ログイン状態でアプリを開く | — | desktop は Bootstrap の `Auth` UI、mobile は `LoginScreen` が表示される（いずれもログイン UI のみで裏側のタブ/カードは表示されない） |
| 2 | ログイン画面表示中 | メールアドレス+パスワードでログイン | セッションが確立し、メイン画面（タブ + 初回データ取得）に遷移する |
| 3 | ログイン画面表示中 | Google または GitHub プロバイダでログイン | 同上（OAuth コールバック後にセッション確立） |
| 4 | ログイン済み | ログアウトボタンを押す | `signOut()` が呼ばれ `session`/`userId` が `null` になり、ログイン画面に戻る。`financialStore` のキャッシュ（`journalAccounts` 等）もクリアされる |
| 5 | 未ログイン | 直接メイン画面 URL にアクセス | `session` が `null` のためログイン画面にリダイレクト（ゲート） |

### 2.2 勘定科目

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 勘定科目未登録 | (desktop) 名称+カテゴリを入力し追加 | 一覧に追加され、`getJournalAccounts()` で最新化される |
| 2 | 既存の通常勘定科目 | (desktop) 編集ボタンから名称/カテゴリを変更して保存 | 一覧が更新される |
| 3 | `acc_`/`card_` プレフィックスの勘定科目を編集開始 | — | カテゴリ `<select>` が `disabled` になる（`isSystemAccount` 判定） |
| 4 | 勘定科目未登録 | (mobile) 名称+カテゴリを入力し「勘定科目を追加」 | 一覧に反映される |
| 5 | 既存勘定科目 | (mobile) 「削除」ボタンを押す | `deleteJournalAccount` が呼ばれ一覧から消える（desktop には削除ボタンがない） |
| 6 | 勘定科目一覧 | カテゴリ別に確認 | Asset/Liability/Equity/Revenue/Expense ごとに正しく分類表示される |

### 2.3 仕訳入力

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 勘定科目登録済み | 日付・摘要・借方・貸方・金額を入力し登録 | RPC `create_journal_entry` が呼ばれ、仕訳が作成され、借方/貸方の勘定科目残高が更新される |
| 2 | 必須項目未入力（例: 摘要が空） | 登録を試みる | desktop は共通 `alert('すべての項目を入力してください。')`、mobile は項目別の個別 `alert` が出て送信されない |
| 3 | mobile で借方=貸方を選択 | 登録を試みる | 「貸方勘定科目を選択してください（借方と異なる科目）」で弾かれる（desktop は同一科目でもブロックされない点に注意） |
| 4 | 既存仕訳 | カレンダーから編集し保存 | `updateJournalEntry` が呼ばれ、カレンダー・残高に反映される |
| 5 | 既存仕訳（mobile） | カレンダーの取引一覧から削除 | `deleteJournalEntry` が呼ばれ、`refreshEntries()` でカレンダーが再取得される |
| 6 | 仕訳登録後 | カレンダーの当該日を確認 | 費用/収益サマリー、仕訳件数が反映される |

### 2.4 カレンダー

| # | Given | When | Then |
|---|-------|------|------|
| 1 | カレンダー表示中 | 月を前後に移動する | `getCalendarJournalEntries(startDate, endDate)` が新しい月の範囲で再取得される（同じ月に戻っても再フェッチしない: `lastFetchRef`） |
| 2 | 仕訳・イベントがある日 | 日付を選択 | 選択日の仕訳一覧・イベント一覧・費用/収益サマリーが表示される |
| 3 | (desktop) 借方/貸方フィルタを設定 | 日付選択・タイル表示を確認 | フィルタ条件に合う仕訳のみが集計・表示される |
| 4 | (mobile) 日付をダブルタップ | — | 取引入力ダイアログ（`TransactionEntryCard`）がその日付で開く |

### 2.5 ダッシュボード（PL/BS）

| # | Given | When | Then |
|---|-------|------|------|
| 1 | ダッシュボード表示 | 期間プリセットを「週」「月」「年」に切り替える | `computePeriodRange` で該当プリセットの範囲が計算され、PL データが再取得される |
| 2 | 月次プリセット、開始日 25日、休日前倒し | 前後の期間ボタンで移動する | 隣接期間同士で日付の重複・欠落が発生しない（#106 回帰。今期間の終了日 + 1日 = 次期間の開始日） |
| 3 | (desktop) PL の期間を変更 | — | BS の基準日が期間の終了日に自動同期する（`handleDateRangeChange`） |
| 4 | (mobile) `PeriodSelector` で期間変更 | — | `handleDashboardPeriodChange` で PL 期間・BS 基準日が同時更新される |
| 5 | ダッシュボード表示 | 資産・負債・収益・費用のいずれかにデータがない | 「項目がありません」（desktop）や空データ扱い（mobile）で崩れずに表示される |

### 2.6 定期取引

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 定期取引未登録 | daily/weekly/monthly/yearly/free の各頻度で登録 | `addRegularJournalEntry` が呼ばれ一覧に反映される |
| 2 | monthly、`dateOfMonth: 31` | 2月などの短い月で実行日判定 | `isExecutionDate` が月末日に clamp して判定する（例: 2026年2月は28日扱い） |
| 3 | monthly、`holidayDivOfMonth: 'before'/'after'` | 実行日が土日にあたる月で判定 | 前倒し/後倒しで調整された日付が実行日になる |
| 4 | 定期取引一覧 | 「実行」ボタンを押す | `executeRegularJournalEntry` が呼ばれ、仕訳が1件作成され `last_executed_date` が本日に更新される |
| 5 | 期限到来の定期取引が複数ある | (desktop) マウント直後、または10分経過 / (mobile) 「期限到来分を実行」ボタン | `executeDueRegularJournalEntries` が該当分を一括実行し、実行件数が表示される |
| 6 | 本日すでに実行済みの定期取引 | 再度「実行」を押す、または一括実行を再度走らせる | `last_executed_date === 本日` のため実行されない（同日重複実行防止） |

### 2.6.1 支出目標（mobile のみ）

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 支出目標未登録 | `transaction` タブまたは `pl-bs` タブの「目標を設定」から費用科目・期間（日次/月次）・金額を指定して保存 | `addGoal` が呼ばれ、両タブの `GoalCard` 一覧に反映される |
| 2 | 同一の費用科目・期間で既に目標が存在 | 同じ組み合わせで別の金額を保存 | 新規追加ではなく `updateGoal` が呼ばれ、既存目標の金額が上書きされる |
| 3 | 目標を1件設定済み（月次） | 当月分の費用仕訳を登録する | 進捗バーの実績金額（`fn_profit_loss` の当月集計）が増加し、目標超過時はバーが赤色になる |
| 4 | 目標一覧 | 「削除」ボタンを押す | `deleteGoal` が呼ばれ一覧から消える |

### 2.7 スケジュールイベント

（現状 desktop のみに UI があり、mobile には未実装）

| # | Given | When | Then |
|---|-------|------|------|
| 1 | イベント未登録 | 終日イベントを登録（タイトル・開始日・終了日のみ） | `addEvent` が呼ばれ一覧・カレンダーに反映される |
| 2 | イベント未登録 | 時間指定イベントを登録（開始/終了時刻あり） | 同上。時刻も保存される |
| 3 | 終日フラグ ON | 開始/終了時刻を入力しようとする | バリデーションで弾かれる（フォームは時刻入力欄自体を非表示にする） |
| 4 | 開始日 > 終了日 | 登録を試みる | `alert('開始日は終了日より前である必要があります。')` |
| 5 | タイトル101文字以上 | 登録を試みる | `alert('タイトルは100文字以内である必要があります。')`（input も `maxLength=100`） |
| 6 | 既存イベント | 編集・更新 | `updateEvent` が呼ばれ一覧・カレンダーに反映される |
| 7 | 既存イベント | 削除（確認ダイアログで OK） | `deleteEvent` が呼ばれ一覧から消える |

### 2.8 デバイス振り分け

| # | Given | When | Then |
|---|-------|------|------|
| 1 | スマートフォンの UA でアクセス | — | `isMobileDevice()` が `true` を返し mobile UI が表示される |
| 2 | iPad の UA でアクセス | — | `isMobileDevice()` が `false` を返し desktop UI が表示される（iPad は明示的に除外） |
| 3 | PC の UA でアクセス | — | desktop UI が表示される |
| 4 | Safari のデスクトップモード（UA 書き換え）+ 画面幅 430px 以下のタッチデバイス | — | `maxTouchPoints > 1 && screen.width <= 430` のフォールバックにより mobile UI が表示される |

### 2.9 タイムゾーン

| # | Given | When | Then |
|---|-------|------|------|
| 1 | JST（UTC+9）環境、日付をまたぐ時間帯（例: 深夜0時〜9時） | `todayLocalString()`/`formatDateLocal(new Date())` を呼ぶ | UTC 変換によって前日にずれず、ローカルの当日日付が返る（`getFullYear`/`getMonth`/`getDate` を使用しており `toISOString()` 経由ではないため） |
| 2 | JST 環境 | 定期取引の実行日判定・期間セレクターの計算を行う | すべて `formatDateLocal` ベースで一貫しており、UTC 変換によるズレが起きない |

---

## 3. 回帰観点（リファクタで挙動を変えた4点）

### 3.1 JST 日付ズレ修正

- **変更点**: 日付文字列化を `toISOString()`（UTC 基準）ではなく `formatDateLocal`（ローカルの年月日から直接組み立て）に統一
- **確認手順**: JST 環境（またはシステム時計を JST に設定）で 0:00〜8:59 の時間帯に `todayLocalString()` を呼び、UTC 日付ではなくローカル日付（当日）が返ることを確認する。`packages/shared/src/utils/__tests__/dateUtils.test.ts` の `formatDateLocal`/`todayLocalString` テストで担保

### 3.2 `je_` プレフィックス

- **変更点**: 仕訳エントリー ID のプレフィックスが `entry_`（旧 API 仕様書に記載されていたもの）ではなく `je_` に統一
- **確認手順**: 仕訳を新規登録し、生成された ID が `je_<uuid>` 形式であることを確認（`financialStore.addJournalEntry`、`insertRecurringExecution` の両方）

### 3.3 `dateOfYear` 両形式対応

- **変更点**: 定期取引の年次実行日 `dateOfYear` が `MM-DD` 形式に加え、`<input type="date">` が返す `YYYY-MM-DD` 形式も受け付けるようになった（`recurrence.ts` の `parseDateOfYear`）
- **確認手順**: 年次の定期取引を desktop（`<input type="date">` → `YYYY-MM-DD` 形式で保存）と mobile（`TextInput` で `MM-DD` 形式を直接入力）の両方で作成し、どちらも `isExecutionDate`/`getNextExecutionDate` が正しく判定することを確認。`recurrence.test.ts` の `accepts MM-DD format`/`accepts YYYY-MM-DD format` で担保

### 3.4 実行日判定の一本化

- **変更点**: 定期取引の実行日判定ロジックが `packages/shared/src/utils/recurrence.ts` の `isExecutionDate`/`getNextExecutionDate` に一本化され、desktop・mobile・`financialStore` の `executeDueRegularJournalEntries` がすべて同じ関数を参照するようになった
- **確認手順**: 同一の定期取引データに対して、desktop の「次回実行日」表示（`RecurringTransactionManager`）と mobile の一括実行結果（`RecurringTransactionCard` の「期限到来分を実行」）が矛盾しないことを確認する

### 3.5 月次期間の休日ずらしと期間重複（#106、参考: 上記 2.5 の手動シナリオ）

- **変更点**: `computePeriodRange`/`shiftPeriodRange` の月次終了日計算を「翌期間の（調整後）開始日の前日」に変更し、休日ずらし設定時の期間重複・欠落を解消
- **確認手順**: `packages/shared/src/utils/__tests__/period.test.ts` の `#106 回帰テスト` を実行し、あわせてダッシュボードで開始日25日+休日前倒し/後倒しの設定にして前後の期間ボタンを連続操作し、表示範囲が重複・欠落しないことを目視確認する
