# MyOS 連携用 Finance API（読み取り専用）

> 隣接プロジェクト MyOS（GitHub Pages 配信の PWA）から、家計データを読み取り専用で参照するための Supabase Edge Function。
> MyOS 側の契約は MyOS リポジトリの `docs/feature/finance_integration.md` を参照。

## 概要

- 実体: Supabase Edge Function `supabase/functions/myos/index.ts`（Deno）
- MyOS は書き込みを行わず、サマリ・カテゴリ内訳・大口イベントの取得のみ行う
- 認証は Supabase Auth の JWT ではなく、専用の API トークン（`api_tokens` テーブル）による Bearer 認証
- データソースは既存の RPC `fn_profit_loss` および `journal_entries` / `journal_accounts` テーブル（service role で参照するため RLS はバイパスされる。そのため `p_user_id` / `user_id` フィルタを Edge Function 側で必ず指定する）

## 認証とトークン発行

- `api_tokens` テーブル（`supabase/migrations/20260705000000_myos_api_tokens.sql`）に SHA-256 ハッシュのみ保存する。平文は保存しない。
- 発行は Supabase SQL Editor（postgres / service role）から `fn_issue_api_token` を実行する。

  ```sql
  select fn_issue_api_token('<auth.users の uuid>', 'myos');
  ```

  戻り値の `ast_...` が平文トークン。**この結果はこの一度しか表示されない**ため、MyOS の設定画面にその場で貼り付けること。
- 失効はレコード削除で行う。

  ```sql
  delete from api_tokens where id = '<tok_...>';
  ```

- リクエストは `Authorization: Bearer <ast_...>` ヘッダを付与する。

## エンドポイント仕様

ベース URL: `https://<project-ref>.supabase.co/functions/v1/myos`

### `GET /summary?month=YYYY-MM` または `GET /summary?date=YYYY-MM-DD`

当月、または指定日1日分の収入・支出・収支サマリ。`month` / `date` はどちらか一方のみ指定する（両方指定・両方未指定は 400）。日毎の分析には `date` に前日日付を指定する。

```json
{ "month": "2026-07", "income": 320000, "expense": 277700, "net": 42300 }
```

```json
{ "date": "2026-07-13", "income": 0, "expense": 4200, "net": -4200 }
```

- `income` = `fn_profit_loss` の `category = 'Revenue'` 行の `sum_amount` 合計
- `expense` = 同 `category = 'Expense'` 行の合計
- `net` = `income - expense`

### `GET /categories?month=YYYY-MM` または `GET /categories?date=YYYY-MM-DD`

支出のカテゴリ（勘定科目）別内訳。金額降順。`month` / `date` はどちらか一方のみ指定する（両方指定・両方未指定は 400）。

```json
{ "month": "2026-07", "categories": [ { "name": "食費", "amount": 48200 } ] }
```

```json
{ "date": "2026-07-13", "categories": [ { "name": "食費", "amount": 4200 } ] }
```

### `GET /events?range=YYYY-MM-DD..YYYY-MM-DD&min_amount=N`

指定期間の大口支出イベント。借方勘定科目が `Expense` カテゴリの仕訳のみを対象とし、金額は負値で返す。`min_amount` は絞り込み下限（省略時 0）。

```json
{ "events": [ { "date": "2026-07-02", "title": "家賃", "amount": -95000 } ] }
```

### エラーコード

| コード | 意味 |
|-------|------|
| 400 | パラメータ不正（`month` / `date` / `range` / `min_amount` の形式エラー、`month` と `date` の同時指定・同時未指定を含む） |
| 401 | トークン不正・未指定 |
| 404 | 未定義のパス |
| 500 | サーバー内部エラー（DB エラー含む） |

MyOS 側は 401/403 を「トークンを確認してください」、5xx・タイムアウトを「取得できませんでした」として扱う想定（MyOS 側実装）。

## デプロイ手順

1. マイグレーション適用（`api_tokens` テーブル・`fn_issue_api_token` 関数の作成）

   ```sh
   supabase db push
   ```

   または SQL Editor で `supabase/migrations/20260705000000_myos_api_tokens.sql` の内容を直接実行する。

2. Edge Function をデプロイ。独自の Bearer トークン認証を行うため、Supabase 標準の JWT 検証は無効化する。

   ```sh
   supabase functions deploy myos --no-verify-jwt --project-ref <project-ref>
   ```

3. CORS 許可オリジンを設定（GitHub Pages のオリジン）。

   ```sh
   supabase secrets set MYOS_ALLOWED_ORIGINS=https://<user>.github.io
   ```

   未設定の場合、Edge Function は CORS ヘッダを一切付与しない（ブラウザからの呼び出しは失敗する）。

## セキュリティ注意

- API トークンは平文を保存しない。DB には SHA-256 ハッシュのみ保持する。
- リクエストログ・エラーログにトークン平文・ハッシュを出力しない。
- 本 API は読み取り専用（GET のみ）。書き込みエンドポイントは提供しない。
- `fn_issue_api_token` は `anon` / `authenticated` ロールに EXECUTE 権限を与えていない（SQL Editor からのみ実行可能）。
