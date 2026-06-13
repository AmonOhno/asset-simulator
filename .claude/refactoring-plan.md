# State管理 & サーバー構成 リファクタリングプラン

## 現状の課題

### 優先度: High

| # | 箇所 | 問題 |
|---|------|------|
| H1 | `server/src/config/environment.ts` | Supabase Keyをconsole.logで出力している（セキュリティリスク） |
| H2 | `packages/shared/src/stores/financialStore.ts` | ミューテーション後の`fetchFinancial()`がJournalAccounts以外を再取得しない（部分リフレッシュ）|
| H3 | `server/src/routes/regularJournalEntries.ts` | RPC実行→lastExecutedDate更新が別クエリで走るため、失敗時に状態不整合が起きる |

### 優先度: Medium

| # | 箇所 | 問題 |
|---|------|------|
| M1 | `server/src/tools/comFunc.ts` | `toSnakeCase`/`toCamelCase`がsharedと重複。serverでは未使用（デッドコード）|
| M2 | `packages/shared/src/types/common.ts` | `RecurringTransaction.id`の型がnumber（DBはbigint想定）だがUUID文字列が入っている |
| M3 | `server/src/routes/balanceSheetView.ts` / `profitLossStatementView.ts` | 全行取得後にuser_idでフィルタ（RPCに引数追加すべき）|
| M4 | 全ルート | エラーレスポンスが`{ error: error.message }`だけで、エラーコードや詳細コンテキストがない |
| M5 | `packages/shared/src/stores/financialStore.ts` | LocalStorageにpersistしているが、セッション切れ後の古いデータが残る可能性 |

### 優先度: Low

| # | 箇所 | 問題 |
|---|------|------|
| L1 | `server/src/routes/journalEntries.ts` | DELETE エンドポイントがない |
| L2 | `server/src/routes/scheduleEvents.ts` | IDカラムが`event_id`（他テーブルは`id`）で不統一 |
| L3 | 全LIST API | ページネーション・件数上限なし |
| L4 | 日付処理 | タイムゾーン非考慮（ローカル時刻前提） |

---

## リファクタリングスコープ

このプランでは **H1〜H3 / M1〜M3** を対象とする。
L系と M4/M5 は別タスクとして切り出す。

---

## Phase 1: サーバー構成の修正

### 1-1. `environment.ts` セキュリティ修正

**対象ファイル**: `server/src/config/environment.ts`

**変更内容**:
```ts
// Before
console.log('SUPABASE_KEY:', supabaseKey);

// After
console.log('SUPABASE_KEY:', supabaseKey ? 'Set' : 'Not Set');
```

センシティブな値をログ出力しないよう全ての環境変数のログを `'Set' | 'Not Set'` のみに変更。

---

### 1-2. サーバー側デッドコード削除

**対象ファイル**: `server/src/tools/comFunc.ts`

`toSnakeCase` / `toCamelCase` は `packages/shared/src/types/common.ts` に既に存在し、サーバー内で一切 import されていない。
ファイルごと削除する。

---

### 1-3. RPCのuser_idフィルタ改善

**対象ファイル**: `server/src/routes/balanceSheetView.ts`, `server/src/routes/profitLossStatementView.ts`

**現状**: RPCが全ユーザーのデータを返し、サーバー側でJSフィルタリング
**改善**: RPCに `p_user_id` パラメータを追加して渡す（DB側でフィルタ）

```ts
// Before
const { data, error } = await supabase.rpc('fn_balance_sheet', { p_end_date });
const filtered = data.filter(row => row.user_id === userId);

// After
const { data, error } = await supabase.rpc('fn_balance_sheet', {
  p_end_date,
  p_user_id: userId,
});
```

> **注意**: Supabase側のRPC関数シグネチャ変更が必要。先にDB側を更新すること。

---

## Phase 2: State管理の修正

### 2-1. financialStore のリフレッシュ不整合修正

**対象ファイル**: `packages/shared/src/stores/financialStore.ts`

**現状の問題**:
- ミューテーション後に `fetchFinancial()` を呼んでいるが、その関数は `getJournalAccounts()` しか呼ばない
- `journalEntries` / `regularJournalEntries` は更新されない

**修正方針**:
各ミューテーション後に、変更されたリソースの取得アクションだけを呼ぶ（不要な全体再取得を避ける）。

```ts
// addJournalAccount後
await get().getJournalAccounts();

// addJournalEntry後
await get().getCalendarJournalEntries(start, end);  // 呼び出し側でrange引数管理

// addRegularJournalEntry後
await get().getRegularJournalEntries();
```

`fetchFinancial()` という曖昧な関数は削除し、各アクションが自分の責務だけをリフレッシュするよう整理する。

---

### 2-2. `RecurringTransaction.id` の型修正

**対象ファイル**: `packages/shared/src/types/common.ts`

```ts
// Before
export interface RecurringTransaction {
  id: number;
  ...
}

// After
export interface RecurringTransaction {
  id: string;  // 'reg_<uuid>' 形式
  ...
}
```

---

### 2-3. ケース変換のアーキテクチャ整理

**現状**: `toSnakeCase` / `toCamelCase` がsharedのtypes/common.tsに混在

**改善**: 変換関数を独立ファイルに移動し、型定義とユーティリティを分離

```
packages/shared/src/
├── types/
│   └── common.ts        # 型定義のみ
├── utils/
│   └── caseConvert.ts   # toSnakeCase / toCamelCase
└── stores/
    └── ...
```

`index.ts` から再エクスポートして既存の import パスを維持する。

---

## Phase 3: サーバーでsharedのユーティリティ利用（任意）

`server` から `@asset-simulator/shared` の `toCamelCase` / `toSnakeCase` を import して、
重複していたロジックを統一する（1-2の削除後）。

**条件**: monorepoのworkspaces設定で `server` → `shared` の依存が通ること確認。

---

## 実装順序

```
1. Phase 1-1: environment.ts セキュリティ修正（即実施可能）
2. Phase 2-2: 型修正 RecurringTransaction.id（即実施可能）
3. Phase 2-3: utils/ 分離（型定義とユーティリティの分離）
4. Phase 1-2: サーバーデッドコード削除（Phase 2-3後）
5. Phase 2-1: financialStore リフレッシュ修正（最も影響範囲が広い）
6. Phase 1-3: RPC user_id修正（DB変更を伴うため最後）
```

---

## 対象外（別タスク）

- [ ] エラーレスポンスの統一（エラーコード導入）
- [ ] LocalStorage persistの古いデータ対策（バージョニング）
- [ ] journalEntries の DELETE エンドポイント追加
- [ ] ページネーション実装
- [ ] タイムゾーン対応
