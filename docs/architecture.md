# アーキテクチャ（C4 モデル）

> 本書はリポジトリ内のコード・設定ファイルを確認して作成した C4 モデルのアーキテクチャ図です。
> コードから確認できなかった事項は「未確認」と明記しています。
> より詳細な設計は [`docs/architecture/overview.md`](architecture/overview.md) および [`docs/README.md`](README.md) の各ドキュメントを参照してください。

## 概要

### アプリの目的

家計・資産のシミュレーターアプリ。複式簿記の仕訳（借方・貸方）を記録し、貸借対照表（BS）・損益計算書（PL）、カレンダー、定期仕訳、支出目標、スケジュールイベントを管理・表示する。

### 主な利用者

| 利用者 | 説明 |
|-------|------|
| 一般利用者（本人） | ブラウザ（PC / タブレット / スマートフォン）から Supabase Auth でログインし、自分の仕訳・勘定科目を管理する。データは `user_id` 単位で RLS により分離される |
| MyOS（隣接プロジェクト） | 別リポジトリの PWA。本システムの Edge Function `myos` から API トークン認証で家計データを**読み取り専用**で参照する |
| 運用者（開発者） | Supabase SQL Editor から API トークンを発行（`fn_issue_api_token`）し、スキーマ・Edge Function をデプロイする |

### 技術スタック

| 分類 | 技術 | 根拠 |
|-----|------|------|
| モノレポ | npm workspaces + Turborepo | `package.json`, `turbo.json` |
| エントリーポイント | React 19 + Vite 8 + TypeScript | `client/package.json`, `client/vite.config.ts` |
| PC / タブレット UI | React 18 + Create React App（react-scripts 5）, Bootstrap 5, Chart.js, react-calendar | `desktop/package.json` |
| モバイル UI | React 19 + Vite, 自作コンポーネントライブラリ, Storybook 10 | `mobile/package.json`, `mobile/app/` |
| 状態管理 | Zustand 5（`persist` で localStorage 永続化） | `packages/shared/package.json`, `financialStore.ts` |
| BaaS | Supabase（PostgreSQL 17, PostgREST, RPC, Auth, Edge Functions） | `supabase/config.toml`, `@supabase/supabase-js` |
| 認証 | Supabase Auth + `@supabase/auth-ui-react`（OAuth: Google / GitHub） | `desktop/src/App.tsx`, `mobile/app/src/LoginScreen.tsx` |
| サーバーレス関数 | Supabase Edge Function（Deno） | `supabase/functions/myos/index.ts` |
| ホスティング | Cloudflare Workers Static Assets（`client/dist` を SPA 配信） | `client/wrangler.jsonc` |
| テスト | Jest + ts-jest（`packages/shared`）、React Testing Library（`desktop`） | `jest.config.cjs`, 各 `package.json` |
| ローカル開発 | Supabase CLI + Docker（`supabase start`） | `docs/database/development_policy.md`, `supabase/config.toml` |
| CI/CD | **未確認**（`.github/workflows` は存在しない。Cloudflare の Git 連携で `wrangler deploy` を実行する旨が `client/wrangler.jsonc` のコメントにあるが、設定本体はリポジトリ外） | — |
| IaC / Dockerfile | なし（Supabase CLI の Docker 利用のみ） | — |

---

## Level 1: System Context 図

```mermaid
C4Context
    title System Context 図 - Asset Simulator

    Person(user, "利用者", "PC / タブレット / スマートフォンのブラウザで家計簿・資産を管理する")
    Person(operator, "運用者", "API トークン発行・スキーマ / Edge Function のデプロイ")

    System(assetSim, "Asset Simulator", "複式簿記の仕訳を記録し、BS / PL・カレンダー・定期仕訳・支出目標を提供する家計シミュレーター")

    System_Ext(myos, "MyOS", "隣接プロジェクトの PWA（GitHub Pages 配信）。家計データを読み取り専用で参照")
    System_Ext(oauth, "OAuth プロバイダ", "Google / GitHub（Supabase Auth 経由のソーシャルログイン）")
    System_Ext(cloudflare, "Cloudflare Workers", "SPA の静的アセット配信")

    Rel(user, assetSim, "仕訳の入力・閲覧", "HTTPS / ブラウザ")
    Rel(operator, assetSim, "トークン発行・デプロイ", "Supabase SQL Editor / CLI")
    Rel(myos, assetSim, "サマリ・カテゴリ・大口イベント取得", "HTTPS GET + Bearer トークン")
    Rel(assetSim, oauth, "ソーシャルログイン", "OAuth 2.0")
    Rel(cloudflare, user, "SPA を配信", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

| 名前 | 種別 | 技術 | 責務 |
|-----|------|------|------|
| 利用者 | Person | ブラウザ | 仕訳・勘定科目・定期仕訳・目標・イベントの登録と BS / PL の閲覧 |
| 運用者 | Person | Supabase SQL Editor / Supabase CLI / Wrangler | `fn_issue_api_token` による MyOS 用トークン発行、`supabase db push`・`supabase functions deploy` |
| Asset Simulator | Software System | React SPA + Supabase | 本システム。家計データの記録・集計・表示 |
| MyOS | External System | PWA（GitHub Pages） | Edge Function `myos` から読み取り専用でデータを取得（実装は別リポジトリのため詳細は未確認） |
| OAuth プロバイダ | External System | Google / GitHub | Supabase Auth のソーシャルログイン先（Supabase 側のプロバイダ有効化設定はリポジトリ外のため未確認） |
| Cloudflare Workers | External System | Workers Static Assets | `client/dist` を SPA として配信（`not_found_handling: single-page-application`） |

---

## Level 2: Container 図

```mermaid
C4Container
    title Container 図 - Asset Simulator

    Person(user, "利用者", "ブラウザ")
    System_Ext(myos, "MyOS", "PWA（GitHub Pages）")
    System_Ext(oauth, "OAuth プロバイダ", "Google / GitHub")

    Container_Boundary(cf, "Cloudflare Workers（静的アセット）") {
        Container(client, "client（SPA エントリー）", "React 19 / Vite", "UA 判定で desktop / mobile UI を遅延ロード。desktop・mobile・shared を 1 つのバンドルにビルド")
    }

    Container_Boundary(browser, "ブラウザ内実行") {
        Container(desktop, "desktop UI", "React 18 / Bootstrap / Chart.js", "PC・タブレット向けタブ UI")
        Container(mobile, "mobile UI", "React 19 / 自作コンポーネント", "スマートフォン向けカード UI")
        Container(shared, "shared パッケージ", "TypeScript / Zustand", "ストア・クエリ・ユーティリティ・型。Supabase への唯一のアクセス層")
        ContainerDb(ls, "localStorage", "Web Storage", "financial-store の永続キャッシュ")
    }

    System_Boundary(supa, "Supabase") {
        Container(auth, "Supabase Auth", "GoTrue", "セッション / JWT 発行")
        Container(rest, "PostgREST / RPC", "Supabase API", "テーブル・VIEW・RPC への HTTP アクセス")
        Container(edge, "Edge Function myos", "Deno", "MyOS 向け読み取り専用 Finance API")
        ContainerDb(db, "PostgreSQL", "PostgreSQL 17 + RLS", "仕訳・勘定科目・定期仕訳・目標・イベント・API トークン")
    }

    Rel(user, client, "アクセス", "HTTPS")
    Rel(client, desktop, "PC / タブレット時に lazy import")
    Rel(client, mobile, "スマートフォン時に lazy import")
    Rel(desktop, shared, "ストア / クエリ利用")
    Rel(mobile, shared, "ストア / クエリ利用")
    Rel(shared, ls, "persist")
    Rel(shared, auth, "ログイン / セッション", "supabase-js")
    Rel(shared, rest, "CRUD / RPC", "HTTPS + JWT")
    Rel(auth, oauth, "OAuth")
    Rel(rest, db, "SQL（RLS 適用）")
    Rel(myos, edge, "GET /summary 等", "HTTPS + Bearer")
    Rel(edge, db, "service role で参照", "supabase-js")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

| 名前 | 種別 | 技術 | 責務 |
|-----|------|------|------|
| client（SPA エントリー） | Container | React 19 / Vite 8 / Wrangler | `client/src/main.tsx` が `isMobileDevice()` で UI を振り分け。Vite alias（`@web` / `@mobile` / `@mobile-components` / `@asset-simulator/shared`）で他ワークスペースのソースを取り込みビルドし、`dist/` を Cloudflare Workers にデプロイ |
| desktop UI | Container（ブラウザ内） | React 18 / CRA / Bootstrap / Chart.js / react-calendar | タブ（ダッシュボード・取引・マスタ・定期取引・イベント）による PC / タブレット UI。単体でも `react-scripts` でビルド・`serve` で起動可能 |
| mobile UI | Container（ブラウザ内） | React 19 / Vite / Storybook | タブ（取引・PL/BS・定期取引・勘定科目）によるスマートフォン UI。`mobile/components` は Storybook 対象のコンポーネントライブラリ |
| shared パッケージ | Container（ライブラリ） | TypeScript / Zustand 5 / supabase-js | `@asset-simulator/shared`。Supabase クライアント生成、ストア、読み取りクエリ、ユーティリティ、型定義 |
| localStorage | Data Store | Web Storage | `financial-store` キーで勘定科目・定期仕訳・目標をキャッシュ（`persist` の `version` 管理あり） |
| Supabase Auth | Container（マネージド） | Supabase Auth | OAuth（Google / GitHub）ログイン・セッション管理 |
| PostgREST / RPC | Container（マネージド） | Supabase API | テーブル / VIEW への CRUD、`create_journal_entry`・`fn_balance_sheet`・`fn_profit_loss`・`save_goal` RPC |
| Edge Function `myos` | Container | Deno / supabase-js | `/summary`・`/categories`・`/events` を提供。`api_tokens` の SHA-256 ハッシュで Bearer 認証。`MYOS_ALLOWED_ORIGINS` で CORS 制御 |
| PostgreSQL | Database | PostgreSQL 17 / RLS | テーブル: `journal_accounts`, `journal_entries`, `regular_journal_entries`, `schedule_events`, `goals`, `goal_accounts`, `api_tokens`。VIEW: `v_balance_sheet`, `v_profit_loss_statement`, `v_journal_entries_for_calendar`, `v_journal_entries2` |

> 補足: 旧 API サーバー（Express）は廃止済みで、リポジトリには存在しない。定期仕訳の実行はサーバー側バッチではなく、UI 操作時にクライアント（`executeDueRegularJournalEntries`）から実行される。DB 側の定期ジョブ（pg_cron 等）は `supabase/schemas` 内に確認できない。

---

## Level 3: Component 図

中心となるコンテナは、両 UI が共通利用し Supabase への唯一のアクセス層である **shared パッケージ** と、MyOS 連携の **Edge Function `myos`** の 2 つ。

### 3-1. shared パッケージ（`packages/shared/src`）

```mermaid
C4Component
    title Component 図 - shared パッケージ

    Container(ui, "desktop / mobile UI", "React", "画面コンポーネント")
    ContainerDb(ls, "localStorage", "Web Storage", "永続キャッシュ")
    System_Ext(supabase, "Supabase", "Auth / PostgREST / RPC")

    Container_Boundary(shared, "@asset-simulator/shared") {
        Component(authStore, "authStore", "Zustand", "supabase クライアント生成・セッション・userId")
        Component(finStore, "financialStore", "Zustand + persist", "勘定科目・仕訳・定期仕訳・目標の CRUD とキャッシュ、定期仕訳の実行")
        Component(eventsStore, "eventsStore", "Zustand", "スケジュールイベントの CRUD")
        Component(queries, "queries", "async 関数", "カレンダー用仕訳・よく使う入力・BS / PL の読み取り専用取得")
        Component(utils, "utils", "TypeScript", "ケース変換・日付・期間・繰り返し判定・目標集計・エラー変換")
        Component(types, "types", "TypeScript", "共通型定義（common.ts）")
    }

    Rel(ui, authStore, "セッション参照 / サインアウト")
    Rel(ui, finStore, "アクション呼び出し / 購読")
    Rel(ui, eventsStore, "アクション呼び出し / 購読")
    Rel(ui, queries, "直接呼び出し")
    Rel(finStore, authStore, "client / userId 取得・ログアウト検知")
    Rel(eventsStore, authStore, "client / userId 取得")
    Rel(queries, authStore, "client 取得")
    Rel(finStore, utils, "利用")
    Rel(queries, utils, "利用")
    Rel(finStore, ls, "persist")
    Rel(authStore, supabase, "auth API", "supabase-js")
    Rel(finStore, supabase, "from() / rpc()", "HTTPS")
    Rel(eventsStore, supabase, "from()", "HTTPS")
    Rel(queries, supabase, "from() / rpc()", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

| 名前 | 種別 | 技術 | 責務 |
|-----|------|------|------|
| authStore | Component | Zustand / supabase-js | `REACT_APP_SUPABASE_URL` / `REACT_APP_SUPABASE_ANON_KEY` から Supabase クライアントを生成し、`session` / `userId` を保持 |
| financialStore | Component | Zustand + `persist` | `journal_accounts` / `journal_entries` / `regular_journal_entries` / `goals` の CRUD、`create_journal_entry`・`save_goal` RPC、定期仕訳の実行。ログアウト検知でキャッシュクリア |
| eventsStore | Component | Zustand | `schedule_events` の CRUD |
| queries | Component | async 関数 | `fetchCalendarJournalEntries`（`v_journal_entries_for_calendar`）、`fetchFrequentEntrySets`、`fetchBalanceSheet`（`fn_balance_sheet`）、`fetchProfitLoss`（`fn_profit_loss`） |
| utils | Component | TypeScript | `caseConvert` / `dateUtils` / `period` / `recurrence` / `goals` / `frequentEntries` / `balanceSheet` / `supabaseError`。Jest のユニットテスト対象 |
| types | Component | TypeScript | 型定義のみ（`common.ts`） |

### 3-2. Edge Function `myos`（`supabase/functions/myos/index.ts`）

```mermaid
C4Component
    title Component 図 - Edge Function myos

    System_Ext(myos, "MyOS", "PWA")
    ContainerDb(db, "PostgreSQL", "Supabase", "api_tokens / journal_entries / journal_accounts / fn_profit_loss")

    Container_Boundary(fn, "Edge Function myos（Deno）") {
        Component(router, "ルーター", "Deno.serve", "パス判定（/summary, /categories, /events）と 400 / 404 応答")
        Component(cors, "CORS 制御", "TypeScript", "MYOS_ALLOWED_ORIGINS に一致する Origin のみ許可")
        Component(tokenAuth, "トークン認証", "Web Crypto SHA-256", "Bearer トークンをハッシュ化し api_tokens と照合して user_id を特定")
        Component(handlers, "集計ハンドラ", "supabase-js（service role）", "サマリ・カテゴリ内訳・大口イベントを user_id で絞って集計")
    }

    Rel(myos, router, "GET", "HTTPS + Bearer")
    Rel(router, cors, "利用")
    Rel(router, tokenAuth, "認証")
    Rel(router, handlers, "委譲")
    Rel(tokenAuth, db, "api_tokens 参照")
    Rel(handlers, db, "rpc fn_profit_loss / select")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

| 名前 | 種別 | 技術 | 責務 |
|-----|------|------|------|
| ルーター | Component | `Deno.serve` | リクエストのパス・メソッド判定、クエリパラメータ（`month` / `date` / `range` / `min_amount`）検証 |
| CORS 制御 | Component | TypeScript | 環境変数 `MYOS_ALLOWED_ORIGINS` に含まれるオリジンにのみ CORS ヘッダを付与 |
| トークン認証 | Component | SHA-256 | 平文トークンは保存せず、ハッシュ照合で `user_id` を解決。失敗時 401 |
| 集計ハンドラ | Component | supabase-js（`SUPABASE_SERVICE_ROLE_KEY`） | RLS をバイパスするため、`p_user_id` / `user_id` フィルタを必ず指定して集計 |

※ Edge Function 内部の関数分割は上記の責務単位で整理したもの。詳細は [`docs/api/myos_integration.md`](api/myos_integration.md) を参照。

---

## 主要なデータフロー

### 1. ログインと初期データ取得

```mermaid
sequenceDiagram
    autonumber
    actor U as 利用者
    participant C as client (main.tsx)
    participant UI as desktop / mobile App
    participant A as authStore
    participant F as financialStore
    participant SA as Supabase Auth
    participant P as PostgREST

    U->>C: アプリにアクセス
    C->>C: isMobileDevice() で UI 判定
    C->>UI: lazy import（@web / @mobile）
    UI->>A: refreshSession() / onAuthStateChange 登録
    A->>SA: auth.getSession()
    alt 未ログイン
        UI->>U: Auth UI（Google / GitHub）表示
        U->>SA: OAuth ログイン
        SA-->>UI: onAuthStateChange(session)
    end
    UI->>A: setSession(session) → userId 設定
    UI->>F: fetchJournalAccounts() など個別取得
    F->>P: select ... where user_id = userId
    P-->>F: 行データ（snake_case）
    F->>F: toCamelCase → state 更新 / localStorage 永続化
    F-->>UI: 再レンダリング
```

### 2. 仕訳の登録と BS / PL の表示

```mermaid
sequenceDiagram
    autonumber
    actor U as 利用者
    participant UI as 仕訳フォーム / BS・PL 画面
    participant F as financialStore
    participant Q as queries/reports
    participant P as PostgREST (RPC)
    participant DB as PostgreSQL

    U->>UI: 借方・貸方・金額を入力して保存
    UI->>F: addJournalEntry(entry)
    F->>P: rpc('create_journal_entry', { entry_data, ... })
    P->>DB: INSERT journal_entries（RLS 適用）
    DB-->>F: 結果
    U->>UI: 期間を選択して BS / PL を表示
    UI->>Q: fetchBalanceSheet / fetchProfitLoss
    Q->>P: rpc('fn_balance_sheet' / 'fn_profit_loss', { p_user_id, ... })
    P->>DB: 集計 SQL
    DB-->>UI: 勘定科目別残高
```

### 3. MyOS からの読み取り

```mermaid
sequenceDiagram
    autonumber
    participant M as MyOS (PWA)
    participant E as Edge Function myos
    participant DB as PostgreSQL

    M->>E: GET /summary?month=YYYY-MM (Authorization: Bearer ast_...)
    E->>E: Origin を MYOS_ALLOWED_ORIGINS と照合
    E->>E: トークンを SHA-256 ハッシュ化
    E->>DB: api_tokens からハッシュ一致行を検索
    alt 不一致
        E-->>M: 401
    else 一致（user_id 特定）
        E->>DB: rpc fn_profit_loss(p_user_id, 期間)
        DB-->>E: Revenue / Expense 行
        E-->>M: { month, income, expense, net }
    end
```

---

## ディレクトリ構成

```
asset-simulator/
├── client/                 # SPA エントリーポイント（Vite）。デバイス判定・Cloudflare 配信設定（wrangler.jsonc）
├── desktop/                # PC / タブレット版 UI（React 18 + CRA）
│   └── src/components/     # journal/（仕訳・定期取引・勘定科目）, event/, common/, MainCalendar
├── mobile/                 # モバイル版（React 19 + Vite + Storybook）
│   ├── app/src/            # モバイルアプリ本体（App.tsx と各カード・LoginScreen）
│   ├── components/         # 共通 UI コンポーネントライブラリ（Storybook 対象）
│   ├── src/                # Storybook 用スキャフォールド（アプリ本体ではない）
│   └── docs/               # モバイル UI 関連ドキュメント
├── packages/
│   └── shared/             # @asset-simulator/shared（types / utils / stores / queries）
├── supabase/
│   ├── config.toml         # Supabase CLI ローカル設定（PostgreSQL 17）
│   ├── schemas/            # 宣言的スキーマ（tables / views / functions / policies / triggers / grants）
│   ├── migrations/         # マイグレーション SQL
│   ├── functions/myos/     # MyOS 向け Edge Function（Deno）
│   └── seed.sql            # ローカル用シード
├── docs/                   # 設計ドキュメント（本書を含む）
├── .github/                # Issue / PR テンプレート・CONTRIBUTING（CI ワークフローはなし）
├── .claude/                # Claude Code 設定
├── .mcp.json               # Supabase MCP（staging / prod 読み取り専用）接続設定
├── turbo.json              # Turborepo タスク定義
├── jest.config.cjs         # ルート Jest 設定
└── package.json            # npm workspaces（desktop / packages/* / client）
```

| ディレクトリ | 役割 |
|-------------|------|
| `client/` | 本番配信されるエントリー。desktop / mobile / shared のソースを Vite alias で束ねて 1 つの SPA にビルドする |
| `desktop/` | PC / タブレット向け画面。CRA 単体でも起動可能 |
| `mobile/` | スマートフォン向け画面とコンポーネントライブラリ。npm workspaces には含まれず、個別に `npm install` する構成 |
| `packages/shared/` | 状態管理と Supabase アクセスを集約する共有ライブラリ |
| `supabase/` | DB スキーマ・RPC・RLS・Edge Function を Single Source of Truth として管理 |
| `docs/` | 設計ドキュメント群（索引は [`docs/README.md`](README.md)） |

## 未確認事項

- CI/CD パイプライン（GitHub Actions は存在しない。Cloudflare 側の Git 連携設定・ビルドコマンドはリポジトリ外）
- Supabase 本番プロジェクトの Auth プロバイダ設定・Edge Function のデプロイ状況
- MyOS 側の実装（別リポジトリ）
- 監視・ログ収集基盤（リポジトリ内に設定なし）
