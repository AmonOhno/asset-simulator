# 仕訳入力機能

## 概要

複式簿記の仕訳（借方・貸方）を手動で入力・編集・閲覧する機能。

## ユースケース

- 収入・支出・資産移動を仕訳として記録する
- 過去の仕訳を一覧で確認する
- 誤った仕訳を修正する

## データ構造

`journal_entries` テーブル（詳細: [database/schema.md](../database/schema.md)）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string | `je_<uuid>` 形式 |
| date | date | 仕訳日付 |
| description | string | 摘要 |
| debit_account_id | string | 借方勘定科目 ID（`jacc_` プレフィックス） |
| credit_account_id | string | 貸方勘定科目 ID（`jacc_` プレフィックス） |
| amount | numeric | 金額 |
| user_id | string | 所有ユーザー ID |

## API エンドポイント

→ [api/specification.md](../api/specification.md) の「Journal Entries」セクション参照

## バリデーション

→ [ui/form_validation.md](../ui/form_validation.md) の「JournalEntryForm」セクション参照

## 関連コンポーネント

→ [ui/specification.md](../ui/specification.md) の「取引入力タブ」セクション参照

## 備考

- 仕訳の DELETE エンドポイントは未実装（対応予定）
- ページネーションは未実装（対応予定）
