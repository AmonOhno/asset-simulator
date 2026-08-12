# career — Career Compass

エンジニア転職で **年収 1000 万円** に到達するための、現在地・希望条件・応募状況の管理と
応募書類の自動生成を行うアプリ。資産シミュレーターと同じ Supabase プロジェクト・同じ
認証セッションを共有する、独立したワークスペース。

## 何ができるか

| 画面 | 内容 |
|------|------|
| ダッシュボード | 年収ギャップ、1000 万円レンジ到達力スコア（6 軸）、応募パイプライン、書類の充足度、年収交渉の下書き |
| プロフィール | 氏名・生年月日・連絡先などの履歴書項目、現年収 / 目標年収、GitHub 等の公開リンク |
| スキル | 分類・レベル（1〜5）・実務年数・最終使用年月・主力フラグ |
| 職歴・案件 | 会社単位の職歴（在籍期間・役職・年収）と、プロジェクト（課題 → 施策 → 成果 + 定量成果） |
| 学歴・資格 | 履歴書の年表欄・免許資格欄に転記される情報 |
| 自己PR | 職務要約 / 自己PR / 志望動機 / 強み / キャリアプラン。登録データから下書きを自動生成できる |
| 希望条件 | 業務内容（職種・業界・技術・工程）と業務内容以外（年収・勤務地・リモート・福利厚生・休日）を分けて管理 |
| 応募管理 | 選考ステータス、提示レンジ、オファー年収、希望条件とのマッチ度と未充足条件の警告 |
| 書類生成 | 履歴書 / 職務経歴書 / スキルシートを自動生成し、Markdown・HTML・印刷（PDF 保存）で出力 |

## 起動

```bash
# 依存インストール（リポジトリルートで 1 回）
npm install

# shared の型宣言を生成（typecheck に必要）
npm run build --workspace=@asset-simulator/shared

# 開発サーバー（http://localhost:3100）
npm run dev:career
```

リポジトリルートの `.env` に以下が必要（既存アプリと共通）:

```
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

## テスト・型検査

```bash
npm run test:career                 # ドメインロジックの単体テスト
npm run typecheck --workspace=career
npm run build:career
```

## 構成

```
career/
├── index.html
├── vite.config.ts          # @asset-simulator/shared をソース参照する alias
└── src/
    ├── App.tsx             # タブ切り替え + 認証ゲート + 初回ロード
    ├── stores/
    │   └── careerStore.ts  # Supabase 直接アクセス（Zustand）
    ├── types/career.ts     # 型定義のみ
    ├── lib/                # 純粋関数（テスト対象）
    │   ├── compensation.ts # 年収ギャップ・必要な転職回数・パイプライン集計
    │   ├── marketValue.ts  # 1000 万円レンジ到達力の 6 軸スコアリング
    │   ├── matching.ts     # 応募先 × 希望条件のマッチ度
    │   ├── completeness.ts # 書類ごとの必須項目チェック
    │   ├── drafts.ts       # 自己PR・志望動機・年収交渉の下書き生成
    │   ├── documents/      # 履歴書・職務経歴書・スキルシートの生成
    │   └── download.ts     # ダウンロード・印刷・クリップボード（副作用の集約）
    └── components/         # 画面
```

## 設計上の約束

- **DB アクセスはストア経由のみ**。ミューテーション後は変更したリソースの `fetchXxx` だけを呼ぶ。
- **`lib/` は純粋関数**。DB・React・`Date.now()` に依存させない（基準日は引数で受ける）。
- **ケース変換**は `@asset-simulator/shared` の `toCamelCase` / `toSnakeCase` を使う。
- **ID はクライアント側で発行**する（`prof_` / `skill_` / `exp_` / `proj_` / `edu_` / `cert_` /
  `pr_` / `pref_` / `app_` / `doc_`）。
- スコアリングの重み・閾値は `lib/marketValue.ts` の定数に集約する。

詳細な仕様は [docs/career/specification.md](../docs/career/specification.md) を参照。
