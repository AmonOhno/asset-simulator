# スケジュールイベント機能

## 概要

将来の収支イベント（大きな出費・収入予定など）をスケジュールとして登録・管理する機能。

## ユースケース

- 将来の予定支出（家電買い替え・旅行など）をイベントとして登録する
- イベントの一覧を日付順に確認する
- イベントを編集・削除する

## データ構造

`schedule_events` テーブル（詳細: [database/schema.md](../database/schema.md)）

| カラム | 型 | 説明 |
|-------|---|------|
| id | string | `event_<uuid>` 形式 |
| name | string | イベント名 |
| date | date | 予定日 |
| is_all_day | boolean | 終日フラグ |
| start_time | time | 開始時刻（終日でない場合） |
| end_time | time | 終了時刻（終日でない場合） |
| description | string | 説明（任意） |
| user_id | string | 所有ユーザー ID |

## API エンドポイント

→ [api/specification.md](../api/specification.md) の「Schedule Events」セクション参照

## バリデーション

→ [ui/form_validation.md](../ui/form_validation.md) の「EventScheduleForm」セクション参照

## 関連コンポーネント

→ [ui/specification.md](../ui/specification.md) の「イベントタブ」セクション参照
