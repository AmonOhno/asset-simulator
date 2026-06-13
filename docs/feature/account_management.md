# 口座・勘定科目管理機能

## 概要

金融口座・クレジットカード・勘定科目（仕訳の分類）のマスタデータを管理する機能。

## サブ機能

### 勘定科目管理（journal_accounts）

仕訳の分類に使う勘定科目を登録・編集する。

| カラム | 説明 |
|-------|------|
| id | `jacc_<uuid>` 形式 |
| name | 勘定科目名（例: 「現金」「食費」） |
| category | 区分（Asset / Liability / Equity / Revenue / Expense） |
| balance | 残高（仕訳から集計） |

## API エンドポイント

→ [api/specification.md](../api/specification.md) の「Accounts」「Credit Cards」「Journal Accounts」セクション参照

## バリデーション

→ [ui/form_validation.md](../ui/form_validation.md) の「AccountManager」「JournalAccountManager」セクション参照

## 関連コンポーネント

→ [ui/specification.md](../ui/specification.md) の「マスタ管理タブ」セクション参照
