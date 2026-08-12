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

#### goals.test.ts

| 対象関数 | 観点 |
|---------|------|
| `sumGoalActual` | 対象勘定科目の実績を合計すること／実績マップにない科目は 0 として扱うこと／対象科目が空なら 0 |
| `computeGoalProgress` | 複数科目の合計に対する達成率・残額を返すこと／超過時は `overBudget` と超過額を返すこと／目標金額 0 で 0 除算せず達成率 0 を返すこと |
| `isSameAccountSet` | 順序が異なっても同一セットと判定すること／要素数・要素が異なれば `false` |
| `formatGoalLabel` | `name` があればそれを使うこと／空なら対象科目名を連結すること／上限件数を超えたら「ほか N 件」に省略すること／対象科目が空の場合のフォールバック |
| `migrateLegacyGoal` | 旧形式の `accountId`（単数）を `accountIds` 配列に変換すること／変換後に旧 `accountId` を残さないこと／現行形式はそのまま維持すること／どちらも無ければ空配列にすること |
| 各関数の防御的挙動 | `accountIds` が未定義でも `sumGoalActual` / `computeGoalProgress` / `formatGoalLabel` / `isSameAccountSet` が例外を投げないこと（#148 の白画面再発防止） |

#### supabaseError.test.ts

| 対象関数 | 観点 |
|---------|------|
| `isNetworkError` | supabase-js が fetch 失敗時に詰めるメッセージ（`Failed to fetch` / `NetworkError` / `Load failed`）を通信エラーと判定すること／サーバーから返ったエラー（`code` を持つ）は通信エラーとしないこと |
| `describeSupabaseError` | 通信断のときだけ通信環境の確認を促すこと／`PGRST202`・`PGRST205`・`PGRST200`・`42883`・`42P01` はマイグレーション未適用の可能性を示すこと／`23503` は勘定科目の再読み込みを促すこと／`42501`・`PGRST301` は再ログインを促すこと／未知のコードはサーバーのメッセージとコードをそのまま見せること／メッセージが取れない場合もフォールバック文言を返すこと |

### 1.2 desktop のスモークテスト

`desktop/src/App.test.tsx`（React Testing Library）。ヘッダー文言「会計＆資産シミュレーター」が描画されることのみを確認する簡易テスト。

実行方法:
```
npm run test --workspace=desktop -- --watchAll=false
```

### 1.3 career のユニットテスト

`career/src/lib/__tests__/`（Jest + ts-jest）。`lib/` の純粋関数のみを対象とし、
Supabase・React には依存しない。基準日はテストから固定値を渡す。

| ファイル | 対象 | 観点 |
|---------|------|------|
| `compensation.test.ts` | `countJobChangesToTarget` / `computeIncomeGap` / `summarizePipeline` | 目標到達済みで 0 回になること／ちょうど到達する上げ幅で余分な 1 回を数えないこと／現年収未登録なら率を算出しないこと／進行中でない応募をパイプライン集計から除外すること |
| `marketValue.test.ts` | `evaluateMarketValue` | 空データで総合 0 点かつ打ち手が伸びしろ順に並ぶこと／高単価ドメインを技術スタックの語から検出すること／定量成果なしで該当軸が 0 になること／最終使用から 2 年を超えた主力スキルで鮮度が 0 になること |
| `matching.test.ts` | `scoreIncome` / `evaluateMatch` | 理想額 100・最低ライン 60・下回ると 60 未満になること／希望条件未登録ならスコアを出さないこと／最低ライン割れ・避けたい技術・絶対条件の欠落が警告に出ること／判定材料の無い要素を計算から除外すること |
| `completeness.test.ts` | `evaluateCompleteness` / `evaluateOverallCompleteness` | 書類種別ごとの必須項目が正しいこと／未入力項目に遷移先タブが付くこと／全書類合算で重複ラベルを一意化すること |
| `documents.test.ts` | 履歴書 / 職務経歴書 / スキルシートの生成、`markdownToHtml` | 誕生日前後で満年齢が 1 ずれること／在職中の職歴に「現在に至る」が付くこと／主力プロジェクトが先に並ぶこと／会社に紐づかない案件が「その他」にまとまること／`<script>` がエスケープされ `<br>` と `**強調**` だけ通ること／プロフィール未登録でも例外にならないこと |
| `drafts.test.ts` | 職務要約 / 自己PR / 志望動機 / 年収交渉の下書き | 登録済みの経験年数・主力技術・定量成果が文章に反映されること／データが空でも文章として成立すること |

実行方法:
```
npm run test:career
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
| 1 | 勘定科目未登録 | (desktop) 名称+カテゴリを入力し追加 | 一覧に追加され、`fetchJournalAccounts()` で最新化される |
| 2 | 既存の通常勘定科目 | (desktop) 編集ボタンから名称/カテゴリを変更して保存 | 一覧が更新される |
| 3 | `acc_`/`card_` プレフィックスの勘定科目を編集開始 | — | カテゴリ `<select>` が `disabled` になる（`isSystemAccount` 判定） |
| 4 | 勘定科目未登録 | (mobile) 名称+カテゴリを入力し「勘定科目を追加」 | 一覧に反映される |
| 5 | 既存勘定科目 | (mobile) 「削除」ボタンを押す | `deleteJournalAccount` が呼ばれ一覧から消える（desktop には削除ボタンがない） |
| 6 | 勘定科目一覧 | カテゴリ別に確認 | Asset/Liability/Equity/Revenue/Expense ごとに正しく分類表示される |
| 7 | 株など変動資産の勘定科目 | (desktop) 「サマリー（貸借対照表）に含める」チェックを外して保存 / (mobile) 追加時にチェックを外す、または一覧の「サマリーから除外」ボタンを押す | `includeInSummary: false` で保存され、一覧に「含めない」（desktop）／「サマリー対象外」（mobile）と表示される |

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
| 1 | カレンダー表示中 | 月を前後に移動する | `fetchCalendarJournalEntries(startDate, endDate)` が新しい月の範囲で再取得される（同じ月に戻っても再フェッチしない: `lastFetchRef`） |
| 2 | 仕訳・イベントがある日 | 日付を選択 | 選択日の仕訳一覧・イベント一覧・費用/収益サマリーが表示される |
| 3 | (desktop) 借方/貸方フィルタを設定 | 日付選択・タイル表示を確認 | フィルタ条件に合う仕訳のみが集計・表示される |
| 4 | (mobile) 日付をダブルタップ | — | 取引入力ダイアログ（`TransactionEntryCard`）がその日付で開く |
| 5 | (mobile) 勘定科目フィルタ「すべて」 | 特定の勘定科目を選択 | 借方・貸方のどちらかがその科目に一致する取引だけが取引一覧に表示され、日付セルのドットも該当日のみになる |
| 6 | (mobile) 勘定科目フィルタ選択中 | 月を移動する／取引を追加・編集・削除する | フィルタ選択が保持されたまま、絞り込み結果が更新される |
| 7 | (mobile) 勘定科目フィルタ選択中 | 選択中の科目を勘定科目マスタから削除する | フィルタは「すべて」として扱われ、全取引が表示される |
| 8 | (mobile) 勘定科目フィルタ・表示月・選択日を変更した状態 | 別タブへ移動し「取引」タブに戻る | `CalendarCard` は常時マウントされているため、フィルタ・表示月・選択日がすべて保持される |

### 2.5 ダッシュボード（PL/BS）

| # | Given | When | Then |
|---|-------|------|------|
| 1 | ダッシュボード表示 | 期間プリセットを「週」「月」「年」に切り替える | `computePeriodRange` で該当プリセットの範囲が計算され、PL データが再取得される |
| 2 | 月次プリセット、開始日 25日、休日前倒し | 前後の期間ボタンで移動する | 隣接期間同士で日付の重複・欠落が発生しない（#106 回帰。今期間の終了日 + 1日 = 次期間の開始日） |
| 3 | (desktop) PL の期間を変更 | — | BS の基準日が期間の終了日に自動同期する（`handleDateRangeChange`） |
| 4 | (mobile) `PeriodSelector` で期間変更 | — | `handleDashboardPeriodChange` で PL 期間・BS 基準日が同時更新される |
| 5 | ダッシュボード表示 | 資産・負債・収益・費用のいずれかにデータがない | 「項目がありません」（desktop）や空データ扱い（mobile）で崩れずに表示される |
| 6 | `includeInSummary: false` の勘定科目（変動資産）に残高がある | ダッシュボードの BS（貸借対照表）を表示する | 当該勘定科目は明細・合計（資産合計/純資産合計等）から除外される（`filterSummaryIncludedRows`）。PL（損益計算書）には影響しない |

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
| 1 | 支出目標未登録 | `transaction` タブまたは `pl-bs` タブの「目標を設定」から費用科目1件・期間（日次/月次）・金額を指定して保存 | `addGoal` が呼ばれ、両タブの `GoalCard` 一覧に反映される |
| 2 | 同一の対象科目セット・期間で既に目標が存在 | 同じ組み合わせで別の金額を保存 | 新規追加ではなく `updateGoal` が呼ばれ、既存目標が上書きされる（`isSameAccountSet` による判定） |
| 3 | 目標を1件設定済み（月次） | 月次期間内の費用仕訳を登録する | 進捗バーの実績金額（`fn_profit_loss` のダッシュボード月次期間集計）が増加し、目標超過時はバーが赤色・超過額表示になる |
| 4 | 目標一覧 | 「削除」ボタンを押して確認ダイアログで OK | `deleteGoal` が呼ばれ一覧から消える（`goal_accounts` も CASCADE で削除される） |
| 5 | 月次目標を設定済み | `pl-bs` タブの期間セレクター（月単位）で開始日設定を変更、または前後の期間へ移動 | 月次目標の「対象期間」表示と実績集計がダッシュボードの月次指定期間に同期して更新される（週/年/カスタム選択中は期間設定に基づく現在の月次期間で集計） |
| 6 | 目標を設定済み | 取引を登録・編集・削除する | `refreshSignal` により進捗バーの実績金額が即時再取得される |
| 7 | 支出目標未登録 | 費用科目を複数選択（例: 食費 + 外食費 + 日用品費）して1件の目標として保存 | 1件の目標として一覧に表示され、実績は選択科目の合計（`computeGoalProgress`）で集計される |
| 8 | 複数科目の目標を設定済み、目標名は未入力 | 一覧を表示する | 表示名が対象科目名から生成される（3件以上は「A + B ほか N 件」に省略。`formatGoalLabel`） |
| 9 | 目標を設定済み | 「編集」ボタンから対象科目の追加・除外、期間・金額・目標名の変更を行い保存 | `updateGoal`（RPC `save_goal`）が呼ばれ、対象科目セットが入れ替わり進捗が再計算される |
| 10 | ダイアログで対象科目を1件も選択していない | 「保存」を押す | バリデーションエラー（アラート表示）となり保存されない |
| 11 | 複数科目の目標のうち1科目を、勘定科目管理から削除する | 勘定科目を削除 | `goal_accounts` が CASCADE で削除され対象科目から外れる。目標は残り、残りの科目の合計で集計される |
| 12 | 対象科目が1件だけの目標の、その科目を削除する | 勘定科目を削除 | 対象科目が 0 件になるため `trg_goal_accounts_delete_orphan_goals` が目標自体を削除する |
| 13 | #147 以前のアプリで目標を登録し、localStorage に旧形式（`accountId` 単数・`version` なし）が残っている | ログイン済みの同じブラウザで #148 以降のアプリを開く | 白画面にならず正常描画され、`persist` の `migrate` により `financial-store` が `version: 1` / `accountIds` 配列に変換される |
| 14 | リモート DB に `20260811000000_goals_multi_account.sql` が未適用（`save_goal` / `goal_accounts` が無い） | 目標を保存する | 「支出目標の保存に失敗しました。サーバー側にテーブルまたは関数がありません。DB のマイグレーションが未適用の可能性があります。（PGRST202）」と表示され、原因が画面から切り分けられる |
| 15 | 機内モード等でオフライン | 目標を保存する | 「〜通信に失敗しました。通信環境を確認してもう一度お試しください。」と表示される（サーバーエラーと文言が区別される） |

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

### 2.10 キャリア設計アプリ（career/）

`npm run dev:career`（http://localhost:3100）で確認する。

| # | Given | When | Then |
|---|-------|------|------|
| 1 | 未ログイン | `/` を開く | ログイン画面が表示され、資産シミュレーターと同じアカウントでログインできる |
| 2 | ログイン済み・データ未登録 | ダッシュボードを開く | 年収ギャップが「現年収を登録すると算出される」表示になり、到達力スコアが 0、未入力の必須項目が一覧される |
| 3 | プロフィールで現年収 700 万・目標 1000 万を保存 | ダッシュボードに戻る | 残り 300 万・到達率 70%・「+15%/回なら 3 回、+30%/回なら 2 回」が表示される |
| 4 | スキルを追加し「主力」にする | 職務経歴書を生成する | 「活かせる経験・知識・技術」に主力スキルが並ぶ |
| 5 | プロジェクトを定量成果なしで登録 | 一覧を見る／ダッシュボードを見る | 一覧に警告文が出て、「成果の定量化」軸のスコアが下がり打ち手に挙がる |
| 6 | 職歴とプロジェクトを紐づけて登録 | 職務経歴書を生成する | 会社見出しの下にプロジェクトがぶら下がり、主力プロジェクトが先頭に出る |
| 7 | 在職中（退社日が空）の職歴がある | 履歴書を生成する | 学歴・職歴欄の末尾に「現在に至る」と「以上」が入る |
| 8 | 希望条件（希望職種・希望年収・勤務地・リモート）を保存 | 履歴書を生成する | 本人希望記入欄が希望条件から生成され、末尾が「上記以外は貴社規定に従います。」になる |
| 9 | 希望条件を保存済み、応募先に提示レンジ・技術スタックを登録 | 応募管理を開く | マッチ度が % で出て、要素ごとの内訳が表示される |
| 10 | 応募先の提示額が「絶対に下回れない年収」を下回る | 応募管理を開く | 「未充足の条件」に最低ライン割れが表示される |
| 11 | 自己PR タブで種別を選び「下書きを生成」 | 生成された文章を確認する | 登録済みのスキル・プロジェクト・定量成果が反映された叩き台が入力欄に入る（保存は手動） |
| 12 | 書類生成タブで必須項目が未入力 | 充足度パネルを見る | 未入力項目が列挙され、充足度が 100% 未満で表示される |
| 13 | 書類生成タブで「印刷 / PDF 保存」 | 押す | 別ウィンドウに A4 レイアウトの書類が開き、印刷ダイアログが出る（ポップアップブロック時はその旨が表示される） |
| 14 | 書類生成タブで「この内容を保存」 | 押す | 保存済み一覧に追加され、後から印刷・ダウンロード・削除できる |

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

### 3.6 永続データのスキーマ変更と白画面（#148）

- **変更点**: `financialStore` の `persist` に `version: 1` と `migrate` を追加し、#147 以前の目標（`accountId` 単数）を `accountIds` 配列へ変換するようにした。あわせて `goals.ts` の各関数を `accountIds` 未定義でも例外を投げないようにし、両エントリー（`client/src/main.tsx`・`mobile/app/src/main.tsx`）を `ErrorBoundary` で包んだ
- **確認手順**: DevTools で `localStorage` の `financial-store` を旧形式（`{"state":{"goals":[{"id":"goal_1","accountId":"jacc_xxx","period":"month","amount":30000}]},"version":0}`）に書き換えてリロードし、白画面にならず目標が表示され、`version` が `1` に、目標が `accountIds` 配列に変換されることを確認する
- **補足**: 永続化対象の型を破壊的に変更するときは必ず `version` を上げて `migrate` を追加すること（[`docs/architecture/overview.md`](../architecture/overview.md#状態管理) 参照）

### 3.7 保存失敗の原因が画面から分からない問題

- **変更点**: `GoalCard` の保存・削除失敗時のアラートが常に「通信を確認してください」だったため、実際の原因（RPC 未作成・権限不足・制約違反）が利用者にもログにも残らなかった。`describeSupabaseError`（`packages/shared/src/utils/supabaseError.ts`）で Supabase のエラーコードを利用者向けの原因説明に変換して表示するようにした
- **確認手順**: 上記 2.6.1 の手動シナリオ 14・15 を実施する。ローカルスタックで再現する場合は `supabase db reset` 後に `DROP FUNCTION public.save_goal(uuid, text, text, text, numeric, text[]);` を実行してから目標を保存する
- **補足**: マイグレーションのリモート反映は手動運用（[`docs/database/development_policy.md`](../database/development_policy.md) 6章）。`goals` 系のように新規 RPC・テーブルを伴う変更をマージしたら、`supabase db push --linked` を実行するまで本番では保存が失敗する
