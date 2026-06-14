# Asset Simulator Component Design 仕様書

## 概要
本ドキュメントは、アセットシミュレーターにおける各UIコンポーネントのデザインおよび実装仕様を定義するものである。
特に**モバイルデバイス（Width: 390px以下）**での表示を最適化し、ユーザーが狭い画面内でも直感的に資産計算操作を行える構成とする。

## レイアウトの原則 (モバイル対応)
- **Box-Sizing**: 全てのコンポーネントで `box-sizing: border-box;` を使用し、パディングによるサイズ崩れを防止する。
- **Vertical Stack**: 390px以下の幅では、要素を横に並べず、すべて垂直方向（縦）に並べることを基本とする。
- **Typography**: 最小フォントサイズは、iOSのズーム現象を防ぐため原則 `14px` 以上（DataGrid等の特殊ケースを除く）とする。

---

## コンポーネント仕様

## 1. Card
### 基本デザイン仕様
デバイス幅 390px 以下のスマホ環境に最適化された、静的な外観および構造の定義。

| セクション | 項目 | 数値 / 指定 | 備考 |
| :--- | :--- | :--- | :--- |
| **全体** | **Width** | **358px** | 左右マージン16pxを確保 ($390 - 32$) |
| | **Border Radius** | 12px | 角丸によるモダンな外観 |
| | **Background** | #FFFFFF | 白背景 |
| | **Shadow** | 0px 4px 12px rgba(0,0,0,0.08) | 視認性を高める軽い影 |
| **Header** | **Height** | **32px (Fixed)** | 開閉トリガーとなる固定高エリア |
| | **Layout** | Flex / Row | 両端配置 (Space-between) |
| | **Padding** | 0 12px | 内部の左右余白 |
| **Body** | **Layout** | Flex / Column | HeadとMainを垂直に配置 |
| | **Padding** | 20px | コンテンツ周囲の一定余白 |
| | **Overflow** | `overflow-y: auto` | maxHeight超過時にBody内のみスクロール |

### 開発用 Props 仕様
開発者がコンポーネント実装時に制御可能なインターフェース定義。

| 分類 | Props名 | 型 | 説明 |
| :--- | :--- | :--- | :--- |
| **状態管理** | **isExpanded** | `boolean` | 内容（Body）の表示・非表示を制御 |
| | **onToggle** | `function` | Headerクリック時に発火。親で `isExpanded` を更新 |
| **表示テキスト**| **title** | `string` | Header左側に表示されるカード名称 |
| | **subInfo** | `string` | Header右側に表示される補助的なテキスト情報 |
| **スタイル制御**| **maxHeight** | `string \| number` | 全体の最大高。超過時はBody内がスクロール |

---

### コンポーネント階層構造

```text
<Card> (Container)
  │
  ├── <Header> (Height: 32px / Clickable)
  │     ├── <Title> (Left)
  │     └── <SubInfo> (Right)
  │
  └── <Body> (Visible if isExpanded is true)
        │
        ├── <BodyHead> (Summary Area)
        │     └── [子要素を配置]
        │
        └── <BodyMain> (Main Content Area)
              └── [入力フォームなどを配置]
```

---

## 2. CommonButton
アクションを実行するためのボタンコンポーネント。

### 基本デザイン仕様
| 項目 | 数値 / 指定 | 備考 |
| :--- | :--- | :--- |
| **Height** | S / M / L variant (S: 32px, M: 48px, L: 64px) | `sizeVariant` によって高さを切替。モバイルでのタップ領域を確保 |
| **Border Radius** | 8px | |

### 開発用 Props 仕様
| Props名 | 型 | 説明 |
| :--- | :--- | :--- |
| **label** | `string` | ボタンに表示するテキスト |
| **sizeVariant** | `'S' \| 'M' \| 'L' \| 'LL' \| 'Full'` | 幅・高さを指定。幅: S(60px), M(120px), L(160px), LL(200px), Full(100%)。高さ: S(32px), M(48px), L(64px), LL/Full(48px) |
| **colorVariant**| `'primary' \| 'secondary'` | ブランドカラーか補助カラーかの切り替え |
| **fontSize** | `'S' \| 'M' \| 'L'` | フォントサイズのバリアント。S=14px, M=16px, L=18px |
| **icon** | `string` | アイコン名（ライブラリ内の名前を指定） |
| **onClick** | `function` | クリック時に実行される関数 |

---

## 3. DataGrid
シミュレーション結果（数値推移など）を表示する、表示特化型コンポーネント。

### 基本デザイン仕様
| 項目 | 数値 / 指定 | 備考 |
| :--- | :--- | :--- |
| **Row Height** | 40px | 1行の高さ |
| **Font Size** | 12px ~ 13px | 情報密度を考慮し、他の要素よりやや小さめ |
| **Overflow** | `overflow-x: auto` | 横幅を超える場合はスクロール |

### 開発用 Props 仕様
| Props名 | 型 | 説明 |
| :--- | :--- | :--- |
| **data** | `Array<T>` | 表示するデータのオブジェクト配列 |
| **columns** | `ColumnConfig[]` | `{label, key, width, align}` の設定配列 |
| **colorVariant**| `'blue' \| 'red' \| 'gray'` | 行のハイライトやベースカラーのテーマ |

---

## 4. DateInput
運用開始日などの日付を選択するフォーム。

### 基本デザイン仕様
| 項目 | 数値 / 指定 | 備考 |
| :--- | :--- | :--- |
| **Height** | S / M / L / Full variant (S: 32px, M: 44px, L: 56px, Full: 44px) | `sizeVariant` によって高さを切替 |
| **Date Range** | **2000-01-01 ~ 2100-12-31** | アプリ内共通の固定範囲 |
| **Format** | YYYY/MM/DD | **時刻・曜日は非表示（日付のみ）** |

### 開発用 Props 仕様
| Props名 | 型 | 説明 |
| :--- | :--- | :--- |
| **value** | `string` | 内部値 (YYYY-MM-DD) |
| **onChange** | `function` | 値が変更された際の処理 |
| **onBlur** | `function` | 入力・選択が確定し、フォーカスが外れた際の処理 |
| **sizeVariant** | `'S' \| 'M' \| 'L' \| 'Full'` | コンポーネント幅・高さ。幅: S(130px), M(160px), L(240px), Full(100%)。高さ: S(32px), M(44px), L(56px), Full(44px) |
| **fontSize** | `'S' \| 'M' \| 'L'` | フォントサイズのバリアント。S=14px, M=16px, L=18px |

---

## 5. NumericInput
資産額や利率などを入力する数値専用フォーム。

### 基本デザイン仕様
| 項目 | 数値 / 指定 | 備考 |
| :--- | :--- | :--- |
| **Height** | S / M / L / Full variant (S: 32px, M: 44px, L: 56px, Full: 44px) | `sizeVariant` によって高さを切替 |
| **Text Align** | Right | 数値の桁を揃えるため右寄せ |
| **Input Mode** | decimal | スマホで数値キーボードを自動起動 |

### 開発用 Props 仕様
| Props名 | 型 | 説明 |
| :--- | :--- | :--- |
| **value** | `number` | 現在の数値 |
| **unit** | `string` | 「円」「%」「年」等の単位ラベル |
| **min / max** | `number` | バリデーション用の最小値・最大値 |
| **error** | `string` | エラー時に表示するメッセージ |
| **onBlur** | `function` | フォーカスが外れたタイミングでの確定処理 |
| **sizeVariant** | `'S' \| 'M' \| 'L' \| 'Full'` | コンポーネント幅・高さ。幅: S(120px), M(160px), L(240px), Full(100%)。高さ: S(32px), M(44px), L(56px), Full(44px) |
| **fontSize** | `'S' \| 'M' \| 'L'` | フォントサイズのバリアント。S=14px, M=16px, L=18px |

---

## 6. SelectInput
運用プランなどを選択するプルダウン。独自アイコンでスタイルを統一。

### 基本デザイン仕様
| 項目 | 数値 / 指定 | 備考 |
| :--- | :--- | :--- |
| **Appearance** | `none` | ブラウザ標準の矢印を非表示にし、独自SVGを表示 |
| **Height** | S / M / L / Full variant (S: 32px, M: 44px, L: 56px, Full: 44px) | `sizeVariant` によって高さを切替 |

### 開発用 Props 仕様
| Props名 | 型 | 説明 |
| :--- | :--- | :--- |
| **options** | `{label, value}[]` | 選択肢の表示名と内部値のセット |
| **value** | `string \| number` | 現在の選択値 |
| **onChange** | `function` | 選択が変更された際の処理 |
| **sizeVariant** | `'S' \| 'M' \| 'L' \| 'Full'` | コンポーネント幅・高さ。幅: S(140px), M(160px), L(240px), Full(100%)。高さ: S(32px), M(44px), L(56px), Full(44px) |
| **fontSize** | `'S' \| 'M' \| 'L'` | フォントサイズのバリアント。S=14px, M=16px, L=18px |

---

## 7. TextInput
### 基本デザイン仕様
| 項目 | 数値 / 指定 | 備考 |
| :--- | :--- | :--- |
| **Height** | S / M / L / Full variant (S: 32px, M: 44px, L: 56px, Full: 44px) | `sizeVariant` によって高さを切替 |
| **Font Size** | S / M / L variant (S: 14px, M: 16px, L: 18px) | `fontSize` によって切替。M=16px はiOSの自動ズーム防止推奨 |

### 開発用 Props 仕様
| Props名 | 型 | 説明 |
| :--- | :--- | :--- |
| **placeholder** | `string` | プレースホルダーテキスト |
| **sizeVariant** | `'S' \| 'M' \| 'L' \| 'Full'` | コンポーネント幅・高さ。幅: S(120px), M(160px), L(240px), Full(100%)。高さ: S(32px), M(44px), L(56px), Full(44px) |
| **fontSize** | `'S' \| 'M' \| 'L'` | フォントサイズのバリアント。S=14px, M=16px, L=18px |
| **value** | `string` | 入力テキスト |
| **onChange** | `function` | 値が変更された際の処理 |
| **onBlur** | `function` | フォーカスが外れた際の確定処理 |


