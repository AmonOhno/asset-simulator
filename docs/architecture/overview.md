# システム概要・アーキテクチャ

## プロジェクト概要

家計・資産のシミュレーターアプリ。複式簿記の仕訳を記録し、貸借対照表（BS）・損益計算書（PL）を表示する。
Turborepo モノレポ構成。バックエンドは Supabase（PostgreSQL + PostgREST + RPC）。**API サーバー（Express）は廃止済み**で、フロントエンドの Zustand ストアが `@supabase/supabase-js` を通じて直接 Supabase にアクセスする。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| モノレポ管理 | Turborepo |
| PC/タブレット版フロントエンド | React 18 + TypeScript（Create React App、`desktop/`） |
| モバイル版フロントエンド | React 19 + TypeScript + Vite（`mobile/app/`） |
| モバイル向けコンポーネントライブラリ | React 19 + Vite（`mobile/components/`）、Storybook で開発・確認 |
| エントリーポイント | React 19 + Vite（`client/`）、デバイス判定で desktop/mobile を振り分け |
| 状態管理 | Zustand（`@asset-simulator/shared`） |
| データベース・バックエンド | Supabase（PostgreSQL、PostgREST、RPC 関数） |
| 認証 | Supabase Auth（JWT ベースのセッション。`@supabase/auth-ui-react` の Auth UI を使用） |
| テスト | Jest（`packages/shared`）、React Testing Library（`desktop`） |

## ディレクトリ構成

```
asset-simulator/
├── client/              # エントリーポイント（Vite）。デバイス判定 → desktop/mobile 振り分け
│   └── src/
│       ├── main.tsx             # isMobileDevice() で App を lazy import
│       ├── DesktopApp.tsx       # @web/App の re-export（Bootstrap CSS を読み込む）
│       └── utils/deviceDetect.ts
├── desktop/              # PC/タブレット版 UI（React 18 + CRA）
│   └── src/
│       ├── App.tsx              # タブナビゲーション・認証・初回データ取得
│       └── components/
│           ├── MainCalendar.tsx
│           ├── common/DateRangePicker.tsx
│           ├── journal/          # 仕訳・定期取引・勘定科目関連
│           └── event/            # スケジュールイベント関連
├── mobile/               # モバイル版コンポーネントライブラリ + アプリ（React 19 + Vite + Storybook）
│   ├── app/src/          # モバイルアプリ本体（Zustand 結線・認証ゲート付き）
│   │   └── App.tsx, CalendarCard.tsx, TransactionEntryCard.tsx,
│   │       BalanceSheetCard.tsx, ProfitLossStatementCard.tsx,
│   │       RecurringTransactionCard.tsx, AccountMasterCard.tsx, LoginScreen.tsx
│   ├── components/       # コンポーネントライブラリ（Storybook 対象）
│   │   └── Card, CommonButton, DataGrid, DateInput, Dialog,
│   │       NumericInput, PanelButton, PeriodSelector, SelectInput, TextInput
│   └── src/               # Storybook エントリー用スキャフォールド（Vite デフォルトテンプレート、アプリ本体ではない）
├── packages/
│   └── shared/           # 共有型・ユーティリティ・Zustand ストア
│       └── src/
│           ├── types/    # 型定義のみ（common.ts）
│           ├── utils/    # ユーティリティ関数（caseConvert / dateUtils / period / recurrence）
│           │   └── __tests__/  # Jest ユニットテスト
│           └── stores/   # Zustand ストア（financialStore / eventsStore / authStore）
└── docs/                 # 設計ドキュメント（本ディレクトリ）
```

### client/ の振り分けロジック

`client/src/utils/deviceDetect.ts` の `isMobileDevice()` で UA と `navigator.maxTouchPoints` / `window.screen.width` を見てデバイスを判定し、`client/src/main.tsx` が振り分ける。

- PC / タブレット（iPad 含む） → `desktop/src/App`（Vite alias `@web`）を `DesktopApp.tsx` 経由で読み込み
- スマートフォン → `mobile/app/src/App`（Vite alias `@mobile`）を読み込み

alias は `client/vite.config.ts` で定義:

```ts
'@asset-simulator/shared': '../packages/shared/src/index.ts',
'@web': '../desktop/src/',
'@mobile': '../mobile/app/src/',
'@mobile-components': '../mobile/components/',
```

`mobile/vite.config.ts`（Storybook 開発用、`root: 'app'`）と `mobile/app/vite.config.ts` は `@mobile-components` alias のみを解決する独立した Vite 設定。

## 状態管理

`packages/shared/src/stores/` に Zustand ストアを集約し、desktop・mobile の両 UI から共通利用する。

| ストア | ファイル | 管理対象 |
|-------|---------|---------|
| financialStore | `financialStore.ts` | 仕訳帳勘定科目・仕訳エントリー・定期仕訳の CRUD とキャッシュ（`persist` ミドルウェアで localStorage 永続化） |
| eventsStore | `eventsStore.ts` | スケジュールイベントの CRUD |
| authStore | `authStore.ts` | Supabase クライアント・セッション・`userId` |

**リフレッシュルール**: ミューテーション後は変更したリソースのアクション（`getJournalAccounts()` 等）だけを個別に呼ぶ。広範囲な「全データ再取得」関数は持たない。`financialStore` は `useAuthStore.subscribe` でログアウトを検知し、`userId` が空になったらキャッシュをクリアする。

## shared/utils

| ファイル | 内容 |
|---------|------|
| `caseConvert.ts` | `toCamelCase` / `toSnakeCase`（DB ↔ フロントのケース変換） |
| `dateUtils.ts` | `formatDateLocal`（タイムゾーンずれを起こさないローカル日付フォーマット）、`todayLocalString`、`adjustWeekendDate`（土日の休日ずらし） |
| `period.ts` | `computePeriodRange` / `shiftPeriodRange`（週/月/年プリセットの期間計算）、`DEFAULT_PERIOD_SETTINGS` |
| `recurrence.ts` | `isExecutionDate` / `getNextExecutionDate`（定期取引の実行日判定。daily/weekly/monthly/yearly/free に対応） |

いずれも `packages/shared/src/index.ts` から named export され、`@asset-simulator/shared` としてインポート可能。`mobile/components/periodSelector.utils.ts` は `../../packages/shared/src/utils/period` を re-export するだけで、ロジックの実体は shared 側の一箇所に集約されている。

## Supabase アクセス方針

- 全アクセスは `packages/shared/src/stores/*.ts` から `supabase-js` の PostgREST クエリ / RPC 呼び出しで行う（サーバーレス）
- RPC 引数には `p_` プレフィックス（例: `p_user_id`, `p_end_date`）
- RPC には必ず `p_user_id` を渡して DB 側でフィルタ（クライアント側 JS フィルタは使わない）
- 各テーブルには Row Level Security（RLS）を設定し、`user_id` でユーザーごとにデータを分離する想定
- 詳細は [`docs/api/specification.md`](../api/specification.md) を参照

## ケース変換規則

| 境界 | 規則 |
|-----|------|
| DB（PostgreSQL） | snake_case |
| フロントエンド（React / Zustand） | camelCase |

変換には `packages/shared/src/utils/caseConvert.ts` の `toCamelCase` / `toSnakeCase` を使用する。

## ID 命名規則

| リソース | プレフィックス | 例 |
|---------|--------------|---|
| 勘定科目 | `jacc_` | `jacc_<uuid>` |
| 仕訳エントリー | `je_` | `je_<uuid>` |
| 定期仕訳 | `reg_` | `reg_<uuid>` |
| スケジュールイベント | `event_` | `event_<uuid>` |

`desktop/src/components/journal/JournalAccountManager.tsx` の `isSystemAccount()` はプレフィックス `acc_` / `card_` を「システム勘定科目」として扱うが、現行 UI に金融口座（Account）・クレジットカード（CreditCard）の管理画面は存在せず、`packages/shared/src/types/common.ts` に型定義のみが残る（未使用）。

## セキュリティ

- `console.log` に環境変数の値を直接出力しない
- `environment.ts` では `value ? 'Set' : 'Not Set'` のみログ出力
- Supabase の Row Level Security によりテーブルアクセスを制限する想定

## 関連ドキュメント

- [`docs/ui/specification.md`](../ui/specification.md) — 画面構成・コンポーネント仕様・データフロー
- [`docs/api/specification.md`](../api/specification.md) — Supabase アクセス規約・RPC・ストアアクション一覧
- [`docs/database/schema.md`](../database/schema.md) / [`er_diagram.puml`](../database/er_diagram.puml) — DB 設計
- [`docs/test/scenarios.md`](../test/scenarios.md) — テストシナリオ
