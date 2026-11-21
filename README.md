# Asset Simulator

## アーキテクチャ概要

複式簿記の仕訳を記録し、貸借対照表・損益計算書を表示する家計・資産シミュレーター。
React SPA（Cloudflare Workers 配信）が Zustand ストア経由で Supabase に直接アクセスするサーバーレス構成。

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

Container 図・Component 図・データフローの詳細は [docs/architecture.md](docs/architecture.md) を参照。

## ドキュメント

- [CLAUDE.md](CLAUDE.md) — 開発ルール・構成の要約
- [docs/README.md](docs/README.md) — 設計ドキュメント索引
- [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) — Issue / ブランチ / PR 運用
