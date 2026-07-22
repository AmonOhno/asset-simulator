# DB 開発運用方針（Supabase スキーマ管理・ローカル開発）

Supabase 上の DB オブジェクト（テーブル・VIEW・RPC 関数・トリガー・RLS ポリシー）を
**リポジトリを Single Source of Truth として一元管理**し、Docker を使った
ローカル環境でスキーマ変更を動作確認してからリモートへ反映するための運用方針。

関連ドキュメント: [schema.md](schema.md)（テーブル定義）, [er_diagram.puml](er_diagram.puml)（ER 図）,
[../api/specification.md](../api/specification.md)（RPC・VIEW 仕様）

## 1. 背景と目的

### 現状の課題

- リモート Supabase プロジェクトに存在するスキーマの大部分（初期テーブル・トリガー・
  プロシージャ）が `supabase/migrations/` に存在せず、直近の差分マイグレーションのみが
  管理されている（ベースライン未管理）
- `supabase/config.toml` が未作成のため、ローカルスタックを起動できない
- スキーマ変更は Supabase ダッシュボードでの直接操作に依存しており、
  変更履歴・レビュー・ロールバックの仕組みがない

### 目標

1. **全 DB オブジェクトをマイグレーションファイルとしてリポジトリ管理**する
   （リポジトリ = スキーマの正、リモート = 適用先）
2. **`supabase start`（Docker）でローカルに DB を再現**し、スキーマ変更・アプリ動作を
   ローカルで検証してからリモートに反映する
3. スキーマ変更を **Issue 駆動 + PR レビュー** のフローに乗せる

## 2. 管理対象

| 対象 | 管理場所 | 備考 |
|------|---------|------|
| テーブル / VIEW | `supabase/migrations/*.sql` | DDL すべて |
| RPC 関数（プロシージャ） | `supabase/migrations/*.sql` | `p_` プレフィックス規約は CLAUDE.md 参照 |
| トリガー / トリガー関数 | `supabase/migrations/*.sql` | |
| RLS ポリシー | `supabase/migrations/*.sql` | 全テーブル `user_id` フィルタ |
| 拡張（extensions） | `supabase/migrations/*.sql` | `pgcrypto` 等 |
| ローカル検証用シードデータ | `supabase/seed.sql` | `db reset` 時に自動投入 |
| Edge Functions | `supabase/functions/` | 既存（`myos`） |
| ローカルスタック設定 | `supabase/config.toml` | コミット対象 |
| CLI 一時ファイル | `supabase/.temp/` | **gitignore 対象（コミットしない）** |

**対象外**: `auth` / `storage` スキーマの内部テーブル（Supabase 管理領域）。
Auth の設定（プロバイダ等）は当面ダッシュボード管理とする。

## 3. 使用ツール

| ツール | 用途 | 備考 |
|-------|------|------|
| Supabase CLI（v2 系） | マイグレーション管理・ローカルスタック起動 | `brew install supabase/tap/supabase` |
| Docker Desktop | ローカルスタックの実行基盤 | Postgres / GoTrue / PostgREST / Studio 等がコンテナで起動 |

## 4. 初期移行手順（一度だけ実施）

既存リモートスキーマをベースラインとしてリポジトリに取り込む。**別 Issue として実施する。**

```bash
# 1. config.toml を生成（supabase/ 直下に生成される）
supabase init

# 2. リモートプロジェクトにリンク（project-ref はダッシュボード URL 参照）
supabase link --project-ref <project-ref>

# 3. リモートの適用済みマイグレーション履歴を確認
supabase migration list

# 4. リモートスキーマをベースラインとして取り込み
#    （public スキーマのテーブル・VIEW・関数・トリガー・RLS を含む）
supabase db pull

# 5. 既存マイグレーションとの履歴整合（必要な場合のみ）
#    リモートで適用済みなのにローカル履歴にないものは repair でマーク
supabase migration repair --status applied <timestamp>

# 6. ローカルで全マイグレーションが通ることを確認
supabase start
supabase db reset
```

注意点:

- `db pull` が生成するベースラインファイルは、既存の 3 本のマイグレーション
  （`20260705000000` 以降）より**古いタイムスタンプ**になるよう調整し、
  `db reset` で「ベースライン → 差分」の順に適用されることを確認する
- 取り込み後、`supabase db diff --linked` が**差分なし**になることをもって完了とする
- `.gitignore` に `supabase/.temp/` を追加する

## 5. ローカル開発フロー

### スタックの起動・停止

```bash
supabase start    # Docker コンテナ群を起動（初回はイメージ取得で数分）
supabase stop     # 停止（データは保持）
supabase stop --no-backup  # 停止 + ローカルデータ破棄
supabase db reset # migrations 全適用 + seed.sql 投入（スキーマ検証の基本コマンド）
```

### ローカルスタックの既定エンドポイント

| サービス | URL |
|---------|-----|
| API (PostgREST / GoTrue) | `http://127.0.0.1:54321` |
| Postgres 直接続 | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio | `http://127.0.0.1:54323` |

### フロントエンドの接続先切替

ローカル検証時は、環境変数をローカルスタックの値に切り替える
（`supabase start` の出力に API URL / anon key が表示される）。

- 接続先 URL → `http://127.0.0.1:54321`
- anon key → `supabase start` 出力のローカル用キー（公開情報扱いで秘密ではない）

リモート用・ローカル用の env ファイルを分け、**リモートの本番キーとローカルキーを
混在させない**。

### Edge Functions のローカル実行

```bash
supabase functions serve myos --env-file <env-file>
# → http://127.0.0.1:54321/functions/v1/myos/... で検証
```

## 6. スキーマ変更フロー（Issue 駆動）

1. **Issue 作成**（スコープ `DB`。`.github/CONTRIBUTING.md` の規約に従う）
2. **main から作業ブランチを作成**
3. **マイグレーションファイルを作成**（どちらでもよい）
   - 手書き: `supabase migration new <name>` → 生成された SQL ファイルに DDL を記述
   - 差分生成: ローカル Studio でスキーマを変更 → `supabase db diff -f <name>` で SQL 化
4. **ローカル検証**: `supabase db reset` で全マイグレーションが順に通ること、
   アプリ（ローカル接続）で該当機能が動作することを確認
5. **ドキュメント更新**: `docs/database/schema.md`・`er_diagram.puml`・
   `docs/api/specification.md` を変更内容に合わせて更新
6. **PR 作成 → レビュー → マージ**
7. **リモート反映**: マージ後に `supabase db push --linked` を実行（当面は手動運用。
   将来的に GitHub Actions での自動化を検討）

```
Issue → branch → migration 作成 → supabase db reset で検証 → PR → merge → db push
```

## 7. マイグレーション規約

- **ファイル名**: `YYYYMMDDHHMMSS_<snake_case_summary>.sql`（`supabase migration new` の生成形式）
- **適用済みマイグレーションは編集しない**: リモートに push 済みのファイルの修正・削除は禁止。
  修正が必要な場合は新しいマイグレーションを追加する
  （未 push・未マージのファイルはレビュー指摘での修正可）
- **冪等な書き方を推奨**:
  - 関数: `CREATE OR REPLACE FUNCTION`
  - トリガー: `DROP TRIGGER IF EXISTS ... ; CREATE TRIGGER ...`
  - ポリシー: `DROP POLICY IF EXISTS ... ; CREATE POLICY ...`
- **破壊的変更**（`DROP TABLE` / `DROP COLUMN` / 型変更）は Issue・PR に影響範囲を明記し、
  必要ならデータ移行 SQL を同一マイグレーション内に含める
- **RPC 規約**（CLAUDE.md 準拠）: 引数は `p_` プレフィックス、`p_user_id` を必須とし
  DB 側でフィルタする
- 1 マイグレーション = 1 つの論理変更。無関係な変更を混ぜない

## 8. ドリフト検知（リモートとの乖離チェック）

- **ダッシュボードでのスキーマ直接変更は原則禁止**。
  やむを得ず直接変更した場合は、事後に `supabase db pull` で差分をマイグレーションとして
  取り込み、PR でリポジトリに反映する
- リリース前・スキーマ作業の開始前に以下でドリフトを確認する:

```bash
supabase db diff --linked   # 差分なし = リポジトリとリモートが一致
```

- 差分が検出された場合は、原因（未 push のマイグレーション or ダッシュボード直接変更）を
  特定してから作業を開始する

## 9. セキュリティ・コミット規約

- `supabase/.temp/`・`.env` 系ファイルはコミットしない
- `config.toml` に秘密情報（service_role key・DB パスワード等）を書かない
- ローカルスタックの anon key / service_role key は全開発者共通のダミー値であり秘密ではないが、
  リモートのキーと取り違えないよう env ファイルを分離する
- CLAUDE.md のセキュリティルール（環境変数値のログ出力禁止）に従う
