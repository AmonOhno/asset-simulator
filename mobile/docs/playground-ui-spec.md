# Playground UI 設計書

**対象**: `web-new/playground/` — スマホ端末向け UI の開発・デザイン確認用アプリ  
**最終更新**: 2026-06-14

---

## 目次

1. [アプリ概要](#1-アプリ概要)
2. [画面構成](#2-画面構成)
3. [コンポーネントライブラリ](#3-コンポーネントライブラリ)
4. [取引タブ](#4-取引タブ)
5. [PL/BS タブ](#5-plbs-タブ)
6. [定期取引タブ](#6-定期取引タブ)
7. [デザインシステム](#7-デザインシステム)

---

## 1. アプリ概要

### 目的

スマートフォン向け家計・資産シミュレーターの UI コンポーネントを実機に近い状態で確認するための開発用 Playground。サンプルデータを使い、API 接続なしで動作する。

### 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React 19 + TypeScript 6 |
| ビルド | Vite 8 |
| スタイリング | インライン CSS (`CSSProperties`) |
| 外部 UI ライブラリ | なし（フルスクラッチ） |
| 日付ライブラリ | なし（ネイティブ `Date` + HTML5 date input） |

### 起動コマンド

```bash
cd web-new
npm run playground   # http://localhost:5174
```

---

## 2. 画面構成

### 全体レイアウト

```
┌──────────────────────────────────────────┐
│  ヘッダー: 取引管理ダッシュボード        │ 高さ: auto (padding 32px 上)
├──────────────────────────────────────────┤
│                                          │
│  コンテンツエリア (overflowY: auto)      │ flex: 1, padding: 20px
│  maxWidth: 900px                         │
│                                          │
├──────────────────────────────────────────┤
│  [取引]  [PL/BS]  [定期取引]            │ ナビゲーションバー (固定, 下部)
└──────────────────────────────────────────┘
```

### ナビゲーション仕様

| タブ ID | ラベル | 概要 |
|---------|--------|------|
| `transaction` | 取引 | カレンダー + 仕訳入力 |
| `pl-bs` | PL/BS | 財務サマリー + 損益計算書 + 貸借対照表 |
| `recurring` | 定期取引 | 定期仕訳の管理 |

**アクティブ状態**:  
- ボーダーボトム: `3px solid #3B82F6`
- 背景: `#EFF6FF`
- 文字色: `#1F2937` / fontWeight: 600

---

## 3. コンポーネントライブラリ

ソース: `web-new/src/components/`

### 3.1 Card

アコーディオン型コンテナ。展開/折りたたみをトグルで切り替える。

```
┌──────────────────────────────────┐  ← 幅: 358px, borderRadius: 12px
│ タイトル         サブ情報  ▼    │  ← ヘッダー (高さ: 32px, padding: 0 12px)
├──────────────────────────────────┤  ← isExpanded=true のときのみ表示
│ CardBodyHead                     │  ← padding: 20px
│ ─────────────────────────────── │
│ CardBodyMain                     │
└──────────────────────────────────┘
```

| Prop | 型 | 説明 |
|------|----|------|
| `title` | string | ヘッダー左のタイトル |
| `subInfo` | string? | ヘッダー右のサブテキスト（期間・日付など） |
| `isExpanded` | boolean | 展開状態 |
| `onToggle` | () => void | 展開/折りたたみコールバック |
| `maxHeight` | string \| number? | 最大高さ（指定時 overflowY: auto） |

---

### 3.2 DateInput

HTML5 ネイティブ date input のラッパー。

| Prop | 型 | デフォルト |
|------|----|-----------|
| `value` | string | — (YYYY-MM-DD) |
| `onChange` | (v: string) => void | — |
| `sizeVariant` | "S" \| "M" \| "L" \| "Full" | "Full" |

| sizeVariant | 幅 |
|------------|-----|
| S | 140px |
| M | 160px |
| L | 240px |
| Full | 100% |

スタイル: 高さ 44px, borderRadius 8px, border `1px solid #D1D5DB`, 有効範囲 2000-01-01 〜 2100-12-31

---

### 3.3 CommonButton

汎用ボタン。プリセット操作・フォーム送信などに使用。

| Prop | 型 | デフォルト |
|------|----|-----------|
| `label` | string | — |
| `sizeVariant` | "S" \| "M" \| "L" \| "LL" \| "Full" | "M" |
| `colorVariant` | "primary" \| "secondary" | "primary" |
| `icon` | string? | — |
| `onClick` | () => void? | — |

| sizeVariant | 幅 |
|------------|-----|
| S | 80px |
| M | 120px |
| L | 160px |
| LL | 200px |
| Full | 100% |

| colorVariant | 背景 | 文字色 | ボーダー |
|-------------|------|--------|---------|
| primary | #4F46E5 | #FFFFFF | なし |
| secondary | #FFFFFF | #4F46E5 | 1.5px solid #4F46E5 |

スタイル: 高さ 48px, fontSize 16px, fontWeight 700, borderRadius 8px

---

### 3.4 DataGrid

汎用テーブル。型パラメータで行データ型を指定。

```
┌──────────────┬──────────────┬──────────────┐  ← ヘッダー行 (colorVariant で色指定)
│ label        │ label        │ label        │
├──────────────┼──────────────┼──────────────┤
│ データ行 1   │ データ行 1   │ データ行 1   │
└──────────────┴──────────────┴──────────────┘
```

| Prop | 型 | 説明 |
|------|----|------|
| `data` | T[] | 行データ配列 |
| `columns` | ColumnConfig\<T\>[] | カラム定義 |
| `colorVariant` | "blue" \| "red" \| "gray" | ヘッダー色 |

`ColumnConfig<T>`: `{ label, key, width?, align?: "left" \| "center" \| "right" }`

---

### 3.5 PanelButton

KPI サマリー表示用の大型パネルボタン。クリックで対応カードへスクロール。

```
┌──────────────────────────────────┐  ← 幅: 358px, padding: 24px 20px
│ title (14px, #6B7280)            │
│ ¥298,000 (36px/800, #0F172A)    │
│ subText (12px, #9CA3AF)          │
└──────────────────────────────────┘
```

| Prop | 型 | 説明 |
|------|----|------|
| `title` | string | KPI 名称 |
| `value` | string \| number | 表示値 |
| `subText` | string? | 補足テキスト（期間・基準日など） |
| `onClick` | () => void | クリック時コールバック |

---

### 3.6 SelectInput / TextInput / NumericInput

フォーム入力用コンポーネント。いずれも `sizeVariant: "S" | "M" | "L" | "Full"` に対応。

| コンポーネント | 用途 |
|--------------|------|
| SelectInput | ドロップダウン選択（勘定科目・頻度・ステータスなど） |
| TextInput | 文字列入力（摘要・名称など） |
| NumericInput | 数値入力（金額）、unit 表示・min/max バリデーション対応 |

---

## 4. 取引タブ

### 構成

```
┌──────────────────────────────────┐
│ CalendarCard                     │
│  月ナビゲーション (< 月名 >)      │
│  週ヘッダー (日〜土)              │
│  日付グリッド (取引件数表示)      │
└──────────────────────────────────┘

↓ 日付選択後に表示

┌──────────────────────────────────┐
│ TransactionEntryCard             │
│  選択日付 表示                    │
│  摘要: TextInput                  │
│  借方勘定科目: SelectInput        │
│  貸方勘定科目: SelectInput        │
│  金額: NumericInput              │
│  [登録] CommonButton (Full)      │
│  ──────────────────────────────  │
│  DataGrid (登録済み仕訳一覧)     │
└──────────────────────────────────┘
```

### CalendarCard の動作

- `onDateSelect(date: string)` コールバックで App.tsx に日付を伝達
- 選択された日付で TransactionEntryCard が表示される（key={selectedDate} でリマウント）
- 取引件数はサンプルデータ (`sampleTransactionRows`) から算出

---

## 5. PL/BS タブ

### 構成

```
┌──────────────────────────────────┐
│ PanelButton: 当期純利益          │ ← 適用期間の利益を表示
│ ¥XXX,XXX                         │
│ {plStartDate} 〜 {plEndDate}     │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ PanelButton: 純資産合計          │ ← 基準日時点の純資産を表示
│ ¥XXX,XXX                         │
│ 基準日: {bsAsOfDate}             │
└──────────────────────────────────┘

┌──────────────────────────────────┐  ← ref={plCardRef} (スクロールターゲット)
│ ProfitLossStatementCard          │
└──────────────────────────────────┘

┌──────────────────────────────────┐  ← ref={bsCardRef} (スクロールターゲット)
│ BalanceSheetCard                 │
└──────────────────────────────────┘
```

### 期間 State の管理 (App.tsx)

```
App.tsx
  ├── plStartDate: string  (今月1日 で初期化)
  ├── plEndDate:   string  (今月末日 で初期化)
  └── bsAsOfDate:  string  (当日 で初期化)
      │
      ├── calculateProfit(plStartDate, plEndDate) → PanelButton に表示
      ├── calculateNetAssets(bsAsOfDate)          → PanelButton に表示
      │
      ├── ProfitLossStatementCard
      │     props: appliedStartDate, appliedEndDate, onApply
      └── BalanceSheetCard
            props: appliedAsOfDate, onApply
```

PanelButton クリック → 対応カードへスムーススクロール。

---

### 5.1 ProfitLossStatementCard (損益計算書【PL】)

#### UI 構成

```
┌──────────────────────────────────┐
│ 損益計算書【PL】  期間  ▼         │  ← ヘッダー (subInfo = 適用期間)
├──────────────────────────────────┤  ← isExpanded=true のときのみ表示
│ [今月] [先月] [今四半期] [今年] │  ← プリセットボタン (secondary/S)
│ [  開始日  ] 〜 [  終了日  ]    │  ← DateInput (S) + DateInput (S)
│                    [期間反映]    │  ← CommonButton (primary/M)
├──────────────────────────────────┤
│ DataGrid (勘定科目 / 区分 / 金額)│
│                                  │
│ 収益合計:         ¥XXX,XXX      │
│ 費用合計:         ¥XXX,XXX      │
│ ────────────────────────────── │
│ 当期純利益:       ¥XXX,XXX      │  ← 黒字: #047857 / 赤字: #DC2626
└──────────────────────────────────┘
```

#### インタラクション仕様

| 操作 | 動作 |
|------|------|
| プリセットボタン押下 | pending・applied 両方を即時更新、`onApply` 呼び出し |
| DateInput 変更 | `pendingStart` / `pendingEnd` のみ更新（データは変わらない） |
| [期間反映] 押下 | `onApply(pendingStart, pendingEnd)` 呼び出し → App.tsx が state 更新 → DataGrid 再描画 |

#### pending / applied の分離

```
pendingStart  ─── DateInput 表示値
pendingEnd    ─── DateInput 表示値
                         │
                  [期間反映] 押下
                         │
appliedStartDate ← onApply(s, e) → App.tsx: setPlStartDate
appliedEndDate   ← onApply(s, e) → App.tsx: setPlEndDate
                         │
                    useMemo (データ絞り込み)
```

#### データ絞り込みロジック

```ts
sampleProfitLossRows.filter(
  (row) => row.date >= appliedStartDate && row.date <= appliedEndDate
)
// 同一 account-category のエントリを集計して DataGrid に表示
```

#### サンプルデータ期間

| 期間 | データ内容 |
|------|-----------|
| 2026-03 | 売上 280,000 / 人件費・家賃・通信費 |
| 2026-04 | 売上 310,000 / 人件費・家賃・通信費・広告費 |
| 2026-05 | 売上 490,000 / 人件費・家賃・通信費 |
| 2026-06 (〜14日) | 売上 150,000 / 人件費・家賃 |

---

### 5.2 BalanceSheetCard (貸借対照表【BS】)

#### UI 構成

```
┌──────────────────────────────────┐
│ 貸借対照表【BS】  基準日  ▼       │  ← ヘッダー (subInfo = 適用基準日)
├──────────────────────────────────┤  ← isExpanded=true のときのみ表示
│ [今日]  [今月末]  [先月末]       │  ← プリセットボタン (secondary/S)
│ [  基準日  ]        [基準日反映] │  ← DateInput (M) + CommonButton (primary/M)
├──────────────────────────────────┤
│ DataGrid (勘定科目 / 区分 / 残高)│
│                                  │
│ 資産合計:          ¥XXX,XXX     │
│ 負債・純資産合計:  ¥XXX,XXX     │
│ ────────────────────────────── │
│ 純資産合計:        ¥XXX,XXX     │  ← 正値: #047857 / 負値: #DC2626
└──────────────────────────────────┘
```

#### インタラクション仕様

| 操作 | 動作 |
|------|------|
| プリセットボタン押下 | pending・applied 両方を即時更新、`onApply` 呼び出し |
| DateInput 変更 | `pendingDate` のみ更新（データは変わらない） |
| [基準日反映] 押下 | `onApply(pendingDate)` 呼び出し → App.tsx が state 更新 → DataGrid 再描画 |

#### データ絞り込みロジック（累積スナップショット方式）

```ts
// 基準日以前のスナップショットを絞り込む
const filtered = sampleBalanceSheetRows.filter((row) => row.date <= appliedAsOfDate);

// 各勘定科目の最新スナップショットを選択
const latestByAccount = {};
filtered.forEach((row) => {
  if (!latestByAccount[row.account] || row.date > latestByAccount[row.account].date) {
    latestByAccount[row.account] = row;
  }
});
```

#### サンプルデータスナップショット

| 基準日 | 資産合計 | 負債合計 | 純資産 |
|--------|---------|---------|--------|
| 2026-03-31 | 300,000 | 300,000 | 0 |
| 2026-04-30 | 370,000 | 370,000 | 0 |
| 2026-05-31 | 440,000 | 440,000 | 0 |
| 2026-06-14 | 430,000 | 430,000 | 0 |

---

## 6. 定期取引タブ

### 構成

```
┌──────────────────────────────────┐
│ RecurringTransactionCard         │
│  取引名: TextInput               │
│  開始日: DateInput               │
│  頻度: SelectInput               │
│  借方科目: SelectInput            │
│  貸方科目: SelectInput            │
│  金額: NumericInput              │
│  ステータス: SelectInput          │
│  [登録] CommonButton (Full)      │
│  ──────────────────────────────  │
│  DataGrid (定期取引一覧)         │
└──────────────────────────────────┘
```

---

## 7. デザインシステム

### カラーパレット

| 用途 | カラーコード | 説明 |
|------|------------|------|
| Primary | `#4F46E5` | メインアクション・ボタン・アクティブタブ |
| Primary Light | `#EFF6FF` | アクティブタブ背景 |
| Blue Accent | `#3B82F6` | タブアクティブボーダー・リンク |
| Success | `#047857` | 黒字・正値 |
| Error | `#DC2626` | 赤字・負値 |
| Text Primary | `#111827` | 本文 |
| Text Secondary | `#4B5563` | ヘッダー文字 |
| Text Muted | `#6B7280` | ラベル・非アクティブタブ |
| Text Placeholder | `#9CA3AF` | プレースホルダー・subText |
| Border | `#D1D5DB` | input ボーダー・区切り線 |
| Border Light | `#E5E7EB` | カード区切り・ナビ上線 |
| Background | `#F3F4F6` | ページ背景 |
| Surface | `#FFFFFF` | カード・ナビ背景 |
| Dark | `#0F172A` | PanelButton 数値 |

### タイポグラフィ

| 用途 | size | weight | color |
|------|------|--------|-------|
| ページタイトル | 34px | — | #4B5563 |
| カードタイトル | 14px | 600 | #333 |
| カードサブ情報 | 13px | — | #888 |
| タブラベル (inactive) | 15px | 400 | #6B7280 |
| タブラベル (active) | 15px | 600 | #1F2937 |
| ボタン | 16px | 700 | — |
| KPI 値 | 36px | 800 | #0F172A |
| KPI タイトル | 14px | — | #6B7280 |
| KPI subText | 12px | — | #9CA3AF |
| サマリー行 | 14px | 700 | — |

### スペーシング

| 場所 | 値 |
|------|----|
| ページ padding | 20px |
| カード間 gap | 24px |
| カード内 padding | 20px |
| カード内要素 gap | 10px |
| プリセットボタン間 gap | 6px |
| フォーム行 gap | 12px |

### カード幅

全カードの幅は固定 **358px**。スマートフォン画面（375px 想定）での表示を前提とする。

### シャドウ

| 用途 | 値 |
|------|----|
| Card | `0px 4px 12px rgba(0,0,0,0.08)` |
| PanelButton | `0 10px 24px rgba(15, 23, 42, 0.08)` |
