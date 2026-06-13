# 財務諸表表示機能

## 概要

登録済みの仕訳エントリーを集計し、貸借対照表（BS）・損益計算書（PL）をリアルタイムで表示する機能。

## ユースケース

- 現時点の資産・負債・純資産の状況を貸借対照表で確認する
- 期間内の収益・費用・利益を損益計算書で確認する
- 日付範囲を指定して集計対象期間を絞り込む

## 勘定科目カテゴリと財務諸表の対応

| カテゴリ | 財務諸表 | 借方増加 / 貸方増加 |
|---------|---------|-------------------|
| Asset（資産） | BS | 借方増加 |
| Liability（負債） | BS | 貸方増加 |
| Equity（純資産） | BS | 貸方増加 |
| Revenue（収益） | PL | 貸方増加 |
| Expense（費用） | PL | 借方増加 |

## API エンドポイント

→ [api/specification.md](../api/specification.md) の「Balance Sheet View」「Profit & Loss Statement View」セクション参照

## 関連コンポーネント

→ [ui/specification.md](../ui/specification.md) の「ダッシュボードタブ」セクション参照
