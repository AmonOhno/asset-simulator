# UI仕様書補足 - フォーム検証・ストレージ・エラーハンドリング

## フォーム検証仕様

### 仕訳入力フォーム (JournalEntryForm)

| フィールド | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| 日付 | - 必須 | 「日付を入力してください」 |
| 摘要 | - 必須<br/>- 1文字以上 | 「摘要を入力してください」 |
| 借方勘定科目 | - 必須<br/>- 有効な勘定科目ID | 「借方勘定科目を選択してください」 |
| 貸方勘定科目 | - 必須<br/>- 有効な勘定科目ID<br/>- 借方と異なる | 「貸方勘定科目を選択してください」 |
| 金額 | - 必須<br/>- 数値のみ | 「金額を正しく入力してください」 |

**検証タイミング**: フォーム送信時

---

### イベント入力フォーム (EventScheduleForm)

| フィールド | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| タイトル | - 必須<br/>- 1～100文字 | 「タイトルを入力してください」<br/>「タイトルは100文字以内である必要があります」 |
| 終日フラグ | - 必須 | N/A（チェックボックス） |
| 開始日 | - 必須<br/>- 有効な日付形式 | 「開始日を選択してください」 |
| 開始時間 | - 終日フラグがfalseの場合は必須<br/>- HH:MM形式 | 「開始時間を入力してください」 |
| 終了日 | - 必須<br/>- 開始日 ≤ 終了日 | 「終了日を選択してください」<br/>「終了日は開始日以降である必要があります」 |
| 終了時間 | - 終日フラグがfalseの場合は必須<br/>- HH:MM形式<br/>- 開始時間 ≤ 終了時間 | 「終了時間を入力してください」<br/>「終了時間は開始時間以降である必要があります」 |

**条件付き検証**:
```
if (allDayFlg === true) {
  startTime と endTime は空である必要がある
} else if (allDayFlg === false) {
  startTime と endTime は必須である
}
```

**検証タイミング**: フォーム送信時

---

### 勘定科目入力フォーム (JournalAccountManager)

| フィールド | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| 勘定科目名 | - 必須<br/>- 1文字以上 | 「勘定科目名を入力してください」 |
| カテゴリ | - 必須<br/>- 有効な値: Asset/Liability/Equity/Revenue/Expense | 「カテゴリを選択してください」 |

**編集時の制約**: システム勘定科目（ID が acc_ または card_ から始まる）の場合、カテゴリは変更不可

**検証タイミング**: フォーム送信時

---

### 金融口座入力フォーム (AccountManager)

| フィールド | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| 口座名 | - 必須 | 「口座名を入力してください」 |
| 金融機関 | - 必須 | 「金融機関を入力してください」 |
| 支店番号 | - 必須 | 「支店番号を入力してください」 |
| 種別 | - 必須 | 「種別を選択してください」 |
| 口座番号 | - 必須 | 「口座番号を入力してください」 |
| 口座名義人 | - 必須 | 「口座名義人を入力してください」 |

**検証タイミング**: フォーム送信時

---

### クレジットカード入力フォーム (CreditCardManager)

| フィールド | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| カード名 | - 必須 | 「カード名を入力してください」 |
| 締め日 | - 必須<br/>- 1～31の整数 | 「締め日を入力してください」<br/>「締め日は1～31の数値である必要があります」 |
| 支払日 | - 必須<br/>- 1～31の整数 | 「支払日を入力してください」<br/>「支払日は1～31の数値である必要があります」 |
| 引落口座 | - 必須<br/>- 有効な口座ID | 「引落口座を選択してください」 |

**検証タイミング**: フォーム送信時

---

### 定期仕訳入力フォーム (RecurringTransactionManager)

※ 詳細は別途 RecurringTransactionManager コンポーネント内ドキュメント参照

| フィールド | ルール |
|-----------|--------|
| 名前 | - 必須 |
| 借方勘定科目 | - 必須 |
| 貸方勘定科目 | - 必須・借方と異なる |
| 金額 | - 必須・0より大きい |
| 周期 | - 必須（daily/weekly/monthly/yearly） |
| 開始日 | - 必須 |

**周期別の必須フィールド**:
- weekly: 少なくとも1つの曜日フラグ（mon_flg_of_week 等）
- monthly: date_of_month (1-31)
- yearly: date_of_year (MM-DD形式)

**検証タイミング**: フォーム送信時

---

## ローカルストレージ仕様

### ストレージキー命名規則

```
{機能名}-{項目名}_{userId}
```

### 使用例

#### ダッシュボード

```javascript
// 損益計算書の日付範囲
Key: dashboard-date-range_{userId}
Value: { startDate: "2026-02-01", endDate: "2026-02-28" }

// 貸借対照表の基準日
Key: dashboard-bs-as-of-date_{userId}
Value: "2026-02-28"
```

**保存タイミング**: 日付範囲を変更したとき
**復元タイミング**: ページ読み込み時
**デフォルト値**: 開始日 = 月初, 終了日 = 本日

#### 損益計算書（スタンドアロン表示）

```javascript
Key: profitAndLoss-dateRange_{userId}
Value: { startDate: "2026-02-01", endDate: "2026-02-28" }
```

**保存タイミング**: 日付範囲を変更したとき
**復元タイミング**: コンポーネントマウント時

#### アカウントマネージャー（スクロール位置）

```javascript
Key: account-manager-scroll_{userId}
Value: 「スクロール位置」
```

**保存タイミング**: スクロール変更時
**復元タイミング**: コンポーネント再表示時
**目的**: 編集後に同じ位置にスクロールを戻す

### ストレージ容量管理

- ブラウザのlocalStorage容量制限: 通常5～10MB
- 本システムでは定期仕訳、イベント等は**サーバーから取得**し、ストレージには**ユーザー設定（日付範囲等）のみ**を保存
- ストレージ容量超過への対策: 不要なキーは定期的にクリア

---

## エラーハンドリング仕様

### フロントエンド側のエラーハンドリング

#### 1. ネットワークエラー

**ユーザーへの通知**: `alert()` または トースト通知

```javascript
try {
  await fetchData();
} catch (error) {
  console.error('Error:', error);
  alert('データの取得に失敗しました。通信を確認してください。');
}
```

#### 2. バリデーションエラー

**表示タイミング**: フォーム送信時
**ユーザーへの通知**: 各フィールド下のエラーメッセージ、またはアラート

```javascript
if (!title || !startDate) {
  alert('必須項目を入力してください。');
  return;
}
```

#### 3. ビジネスロジックエラー

**例**: 既に実行済みの定期仕訳を再実行しようとした場合

```
API レスポンス 400 Bad Request:
{
  "error": "Entry already executed today"
}
```

**ユーザーへの通知**: `alert()` でエラーメッセージを表示

#### 4. 認証エラー

**例**: トークン有効期限切れ

```
API レスポンス 401 Unauthorized
```

**フロントエンド処理**:
```javascript
if (response.status === 401) {
  // ログアウトして認証画面へリダイレクト
  await supabase.auth.signOut();
  setSession(null);
}
```

#### 5. サーバーエラー

**例**: DB接続エラー、内部エラー

```
API レスポンス 500 Internal Server Error:
{
  "error": "エラーメッセージ"
}
```

**ユーザーへの通知**: 「サーバーエラーが発生しました。後でもう一度お試しください。」

---

### エラーリカバリー戦略

#### 自動リトライ

**対象**: ネットワークタイムアウト等の一時的なエラー
**リトライ回数**: 最大3回
**間隔**: 1秒 → 2秒 → 4秒（指数バックオフ）

#### ローカルキャッシュの利用

**対象**: 仕訳、イベント等のデータ取得
**戦略**: サーバーエラーでも前回読み込み分をキャッシュから表示

```javascript
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  // キャッシュがあれば使用
  if (cachedData) {
    setData(cachedData);
    alert('最新データの取得に失敗しました。前回のデータを表示しています。');
  } else {
    alert('エラーが発生しました。');
  }
}
```

---

## レイアウト・スタイル仕様

### Bootstrap グリッドレイアウト

```
コンテナ: container-fluid (padding: 1rem)

レスポンシブブレークポイント:
- lg-4: 約33% (3列レイアウト対応)
- lg-8: 約66% (2列レイアウト対応)

フォーム要素: Bootstrap form-* クラス
- form-label
- form-control
- form-select
- input-group (金額用)

テーブル: Bootstrap table クラス
- table table-sm (コンパクト表示)
- thead / tbody
- table-secondary (ヘッダ背景)

ボタン: Bootstrap btn クラス
- btn-primary (メインアクション)
- btn-secondary (キャンセル等)
- btn-outline-primary (補助アクション)
- btn-sm (テーブル内)

カード: card クラス
- card-header (タイトル)
- card-body (コンテンツ)
- card-body-scrollable (スクロール領域)
```

### よく使うスタイルクラス

| クラス | 用途 |
|-------|------|
| `mb-3` | margin-bottom (1rem) |
| `mb-4` | margin-bottom (1.5rem) |
| `ms-2` | margin-left (0.5rem) |
| `d-flex` | Flexboxレイアウト |
| `justify-content-between` | 左右両端配置 |
| `align-items-center` | 垂直中央揃え |
| `text-center` | 中央揃え |
| `text-muted` | グレーテキスト |
| `text-end` | 右揃え |
| `custom-radius` | カスタム角丸 |

### ダークモード

**現在**: ライトモード固定
**将来**: Theme Supa (Supabase Auth UI) の拡張で対応予定

---

## アクセシビリティ仕様

### キーボード操作

| 操作 | 説明 |
|-----|------|
| Tab | 次のフォーム要素へ移動 |
| Shift + Tab | 前のフォーム要素へ移動 |
| Enter | ボタンをクリック、フォーム送信 |
| Space | チェックボックス、ラジオボタンの切り替え |
| Escape | モーダル/ドロップダウンを閉じる |

### ARIA属性

```jsx
<button
  className="nav-link"
  onClick={() => setActiveTab('transactions')}
  role="tab"
  aria-selected={activeTab === 'transactions'}
  aria-controls="tab-content"
>
  取引入力
</button>
```

### セマンティックHTML

- `<form>` フォーム要素
- `<label htmlFor="...">` ラベルとフォーム要素の関連付け
- `<button type="submit">` 送信ボタン
- `<nav>` ナビゲーション

---

## パフォーマンス最適化

### 状態の分離

- **グローバル状態** (useFinancialStore): 複数コンポーネントで共有するデータ
- **ローカル状態** (useState): コンポーネント内のみで使用するデータ

### 不要なレンダリング防止

```javascript
// useCallback で関数を安定化
const getEntriesForDate = useCallback((date: Date): JournalEntry[] => {
  // ...
}, [monthlyJournalEntries, formatDateToString, debitAccountFilter, creditAccountFilter]);
```

```javascript
// useRef で前回の値を記憶
const lastFetchRef = useRef<{ year: number; month: number } | null>(null);
```

### データ取得の最適化

- **初回ロード**: `fetchFinancial()` を一度だけ実行
- **月別取得**: JournalCalendar で月が変わったときのみ追加取得
- **イベント取得**: activeTab 変更時に必要に応じて再取得

---

## 更新日時

最終更新: 2026-02-28
