# 機能概要

## 機能一覧

| 機能 | 説明 | 詳細ドキュメント |
|-----|------|----------------|
| 仕訳入力 | 複式簿記の仕訳を手動で入力・編集する | [journal_entry.md](journal_entry.md) |
| 定期仕訳 | 毎月の固定費など繰り返す仕訳のテンプレート管理と実行 | [regular_journal.md](regular_journal.md) |
| 財務諸表表示 | 貸借対照表（BS）・損益計算書（PL）のリアルタイム表示 | [financial_statement.md](financial_statement.md) |
| 口座・勘定科目管理 | 金融口座・クレジットカード・勘定科目のマスタ管理 | [account_management.md](account_management.md) |
| スケジュールイベント | 将来の収支イベントのスケジュール管理 | [event_schedule.md](event_schedule.md) |

## 画面構成（タブ）

アプリは 5 つのメインタブで構成される。

```
取引入力（Transactions）
  └─ 仕訳の一覧・入力・編集

ダッシュボード（Dashboard）
  └─ BS / PL の集計表示

定期取引（Regular）
  └─ 定期仕訳テンプレートの管理・実行

マスタ管理（Masters）
  ├─ 金融口座管理
  ├─ クレジットカード管理
  └─ 勘定科目管理

イベント（Events）
  └─ スケジュールイベントの管理
```

## データフロー概要

```
ユーザー操作
  → React コンポーネント
  → Zustand ストア（packages/shared/stores/）
  → Express API（server/src/routes/）
  → Supabase RPC / PostgreSQL
```
