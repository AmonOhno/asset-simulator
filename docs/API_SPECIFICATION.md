# Asset Simulator API 仕様書

## 目次
- [概要](#概要)
- [認証](#認証)
- [エンドポイント一覧](#エンドポイント一覧)
  - [1. 口座管理（Accounts）](#1-口座管理accounts)
  - [2. クレジットカード管理（Credit Cards）](#2-クレジットカード管理credit-cards)
  - [3. 仕訳帳口座管理（Journal Accounts）](#3-仕訳帳口座管理journal-accounts)
  - [4. 仕訳エントリー（Journal Entries）](#4-仕訳エントリーjournal-entries)
  - [5. 仕訳エントリー詳細表示（Journal Entries View）](#5-仕訳エントリー詳細表示journal-entries-view)
  - [6. 定期仕訳エントリー（Regular Journal Entries）](#6-定期仕訳エントリーregular-journal-entries)
  - [7. 貸借対照表表示（Balance Sheet View）](#7-貸借対照表表示balance-sheet-view)
  - [8. 損益計算書表示（Profit & Loss Statement View）](#8-損益計算書表示profit--loss-statement-view)
  - [9. スケジュールイベント管理（Schedule Events）](#9-スケジュールイベント管理schedule-events)
- [ヘルスチェック](#ヘルスチェック)
- [エラーハンドリング](#エラーハンドリング)
- [認証について](#認証について)
- [日付時刻形式](#日付時刻形式)
- [更新日時](#更新日時)

---

## 概要
- **ベースURL**: `http://localhost:3001/api`
- **認証**: すべてのエンドポイントで `authMiddleware` が必須
- **デフォルトポート**: 3001
- **タイムゾーン**: UTC (ISO 8601形式で日付時刻を扱う)

---

## 認証

すべてのAPI エンドポイントにアクセスするには、リクエストヘッダーに認証情報が必要です。

```
Authorization: Bearer <token>
```

---

## エンドポイント一覧

### 1. 口座管理（Accounts）

#### 1.1 すべての口座を取得
| 項目 | 内容 |
|------|------|
| **Routing** | `/accounts` |
| **METHOD** | GET |
| **認証** | 必須 |
| **クエリパラメータ** | なし |
| **REQUEST BODY** | なし |

**RESPONSE (200 OK)**
```json
[
  {
    "id": "acc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "user_id": "user_id",
    "name": "銀行口座A",
    "institution": "○○銀行",
    "branch_number": "001",
    "type": "Checking",
    "account_number": "1234567",
    "account_holder": "山田太郎",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

**エラー (500 Internal Server Error)**
```json
{
  "error": "エラーメッセージ"
}
```

---

#### 1.2 新規口座を作成
| 項目 | 内容 |
|------|------|
| **Routing** | `/accounts` |
| **METHOD** | POST |
| **認証** | 必須 |
| **クエリパラメータ** | なし |

**REQUEST BODY**
```json
{
  "name": "銀行口座A",
  "institution": "○○銀行",
  "branch_number": "001",
  "type": "Checking",
  "account_number": "1234567",
  "account_holder": "山田太郎"
}
```

**必須フィールド**: `name`, `institution`, `branch_number`, `type`, `account_number`, `account_holder`

**RESPONSE (201 Created)**
```json
{
  "id": "acc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "name": "銀行口座A",
  "institution": "○○銀行",
  "branch_number": "001",
  "type": "Checking",
  "account_number": "1234567",
  "account_holder": "山田太郎"
}
```

**エラー (400 Bad Request)**
```json
{
  "error": "Missing required fields"
}
```

---

#### 1.3 口座を更新
| 項目 | 内容 |
|------|------|
| **Routing** | `/accounts/:id` |
| **METHOD** | PUT |
| **認証** | 必須 |
| **URL パラメータ** | `id`: 口座ID |

**REQUEST BODY** (全フィールドまたは更新したいフィールドのみ)
```json
{
  "name": "銀行口座A更新版",
  "institution": "△△銀行",
  "branch_number": "002",
  "type": "Savings",
  "account_number": "7654321",
  "account_holder": "山田太郎"
}
```

**RESPONSE (200 OK)**
```json
{
  "id": "acc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "name": "銀行口座A更新版",
  "institution": "△△銀行",
  "branch_number": "002",
  "type": "Savings",
  "account_number": "7654321",
  "account_holder": "山田太郎"
}
```

**エラー (404 Not Found)**
```json
{
  "error": "Account not found"
}
```

---

### 2. クレジットカード管理（Credit Cards）

#### 2.1 すべてのクレジットカードを取得
| 項目 | 内容 |
|------|------|
| **Routing** | `/credit-cards` |
| **METHOD** | GET |
| **認証** | 必須 |

**RESPONSE (200 OK)**
```json
[
  {
    "id": "card_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "user_id": "user_id",
    "name": "クレジットカードA",
    "closing_day": 20,
    "payment_day": 10,
    "linked_account_id": "acc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### 2.2 新規クレジットカードを作成
| 項目 | 内容 |
|------|------|
| **Routing** | `/credit-cards` |
| **METHOD** | POST |
| **認証** | 必須 |

**REQUEST BODY**
```json
{
  "name": "クレジットカードA",
  "closing_day": 20,
  "payment_day": 10,
  "linked_account_id": "acc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**必須フィールド**: `name`, `closing_day`, `payment_day`, `linked_account_id`

**RESPONSE (201 Created)**
```json
{
  "id": "card_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "name": "クレジットカードA",
  "closing_day": 20,
  "payment_day": 10,
  "linked_account_id": "acc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

---

#### 2.3 クレジットカードを更新
| 項目 | 内容 |
|------|------|
| **Routing** | `/credit-cards/:id` |
| **METHOD** | PUT |
| **認証** | 必須 |
| **URL パラメータ** | `id`: カードID |

**REQUEST BODY** (更新したいフィールド)
```json
{
  "name": "クレジットカードA更新版",
  "closing_day": 25,
  "payment_day": 15
}
```

**RESPONSE (200 OK / 404 Not Found)**
```json
{
  "id": "card_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "name": "クレジットカードA更新版",
  "closing_day": 25,
  "payment_day": 15,
  "linked_account_id": "acc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

---

### 3. 仕訳帳口座管理（Journal Accounts）

#### 3.1 すべての仕訳帳口座を取得
| 項目 | 内容 |
|------|------|
| **Routing** | `/journal-accounts` |
| **METHOD** | GET |
| **認証** | 必須 |
| **ソート順** | category昇順 → name昇順 |

**RESPONSE (200 OK)**
```json
[
  {
    "id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "user_id": "user_id",
    "name": "現金",
    "category": "Asset",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  {
    "id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "user_id": "user_id",
    "name": "売上",
    "category": "Revenue",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### 3.2 新規仕訳帳口座を作成
| 項目 | 内容 |
|------|------|
| **Routing** | `/journal-accounts` |
| **METHOD** | POST |
| **認証** | 必須 |

**REQUEST BODY**
```json
{
  "name": "現金",
  "category": "Asset"
}
```

**必須フィールド**: `name`, `category`

**category の例**: Asset, Liability, Equity, Revenue, Expense

**RESPONSE (201 Created)**
```json
{
  "id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "name": "現金",
  "category": "Asset",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

#### 3.3 仕訳帳口座を更新
| 項目 | 内容 |
|------|------|
| **Routing** | `/journal-accounts/:id` |
| **METHOD** | PUT |
| **認証** | 必須 |
| **URL パラメータ** | `id`: 仕訳帳口座ID |

**REQUEST BODY**
```json
{
  "name": "現金更新版",
  "category": "Asset"
}
```

**必須フィールド**: `name`, `category`

**RESPONSE (200 OK / 404 Not Found)**
```json
{
  "id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "name": "現金更新版",
  "category": "Asset"
}
```

---

### 4. 仕訳エントリー（Journal Entries）

#### 4.1 仕訳エントリーを取得
| 項目 | 内容 |
|------|------|
| **Routing** | `/journal-entries` |
| **METHOD** | GET |
| **認証** | 必須 |
| **クエリパラメータ** | `startDate`: YYYY-MM-DD形式 (オプション) `endDate`: YYYY-MM-DD形式 (オプション) |
| **ソート順** | date降順 |

**使用例**: `/journal-entries?startDate=2024-01-01&endDate=2024-12-31`

**RESPONSE (200 OK)**
```json
[
  {
    "id": "entry_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "user_id": "user_id",
    "date": "2024-01-15",
    "description": "給料入金",
    "debit_account_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "credit_account_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "amount": 250000,
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  }
]
```

---

#### 4.2 新規仕訳エントリーを作成
| 項目 | 内容 |
|------|------|
| **Routing** | `/journal-entries` |
| **METHOD** | POST |
| **認証** | 必須 |

**REQUEST BODY**
```json
{
  "date": "2024-01-15",
  "description": "給料入金",
  "debit_account_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "credit_account_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "amount": 250000
}
```

**必須フィールド**: `date`, `description`, `debit_account_id`, `credit_account_id`, `amount`

**注意**: RPC関数 `create_journal_entry` を呼び出し、残高を自動更新します

**RESPONSE (201 Created)**
```json
{
  "id": "entry_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "date": "2024-01-15",
  "description": "給料入金",
  "debit_account_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "credit_account_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "amount": 250000
}
```

---

#### 4.3 仕訳エントリーを更新
| 項目 | 内容 |
|------|------|
| **Routing** | `/journal-entries/:id` |
| **METHOD** | PUT |
| **認証** | 必須 |
| **URL パラメータ** | `id`: エントリーID |

**REQUEST BODY**
```json
{
  "date": "2024-01-15",
  "description": "給料入金修正",
  "debit_account_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "credit_account_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "amount": 260000
}
```

**必須フィールド**: `date`, `description`, `debit_account_id`, `credit_account_id`, `amount`

**RESPONSE (200 OK / 404 Not Found)**
```json
{
  "id": "entry_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "date": "2024-01-15",
  "description": "給料入金修正",
  "debit_account_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "credit_account_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "amount": 260000
}
```

---

### 5. 仕訳エントリー詳細表示（Journal Entries View）

#### 5.1 詳細な仕訳エントリー一覧を取得
| 項目 | 内容 |
|------|------|
| **Routing** | `/journal-entries/view` |
| **METHOD** | GET |
| **認証** | 必須 |
| **クエリパラメータ** | `startDate`: YYYY-MM-DD形式 (オプション) `endDate`: YYYY-MM-DD形式 (オプション) `description`: テキスト検索 (オプション、部分一致) `debitId`: 借方口座ID (オプション) `creditId`: 貸方口座ID (オプション) `filterMode`: "AND" または "OR" (オプション、デフォルト: "OR") |

**使用例**: `/journal-entries/view?startDate=2024-01-01&endDate=2024-12-31&description=給料`

**RESPONSE (200 OK)**
```json
[
  {
    "entries_id": "entry_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "date": "2024-01-15",
    "description": "給料入金",
    "debit_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "debit_name": "現金",
    "credit_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "credit_name": "給与所得",
    "amount": 250000
  }
]
```

---

### 6. 定期仕訳エントリー（Regular Journal Entries）

#### 6.1 すべての定期仕訳エントリーを取得
| 項目 | 内容 |
|------|------|
| **Routing** | `/regular-journal-entries` |
| **METHOD** | GET |
| **認証** | 必須 |
| **ソート順** | start_date降順 |

**RESPONSE (200 OK)**
```json
[
  {
    "id": "reg_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "user_id": "user_id",
    "name": "給料定期分配",
    "description": "毎月の給料",
    "debit_account_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "credit_account_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "amount": 250000,
    "frequency": "monthly",
    "start_date": "2024-01-01",
    "end_date": null,
    "date_of_month": 15,
    "date_of_year": null,
    "mon_flg_of_week": false,
    "tue_flg_of_week": false,
    "wed_flg_of_week": false,
    "thu_flg_of_week": false,
    "fri_flg_of_week": false,
    "sat_flg_of_week": false,
    "sun_flg_of_week": false,
    "last_executed_date": "2024-01-15",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### 6.2 新規定期仕訳エントリーを作成
| 項目 | 内容 |
|------|------|
| **Routing** | `/regular-journal-entries` |
| **METHOD** | POST |
| **認証** | 必須 |

**REQUEST BODY** (月次の例)
```json
{
  "name": "給料定期分配",
  "description": "毎月の給料",
  "debit_account_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "credit_account_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "amount": 250000,
  "frequency": "monthly",
  "start_date": "2024-01-01",
  "end_date": null,
  "date_of_month": 15
}
```

**必須フィールド**: `name`, `debit_account_id`, `credit_account_id`, `frequency`

**frequency に応じた必須フィールド**:
- `monthly`: `date_of_month` (1-31)
- `yearly`: `date_of_year` (MM-DD形式)
- `weekly`: 少なくとも1つの曜日フラグ (`mon_flg_of_week` 等)

**RESPONSE (201 Created / 400 Bad Request)**
```json
{
  "id": "reg_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "name": "給料定期分配",
  "description": "毎月の給料",
  "debit_account_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "credit_account_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "amount": 250000,
  "frequency": "monthly",
  "start_date": "2024-01-01",
  "end_date": null,
  "date_of_month": 15
}
```

---

#### 6.3 定期仕訳エントリーを更新
| 項目 | 内容 |
|------|------|
| **Routing** | `/regular-journal-entries/:id` |
| **METHOD** | PUT |
| **認証** | 必須 |
| **URL パラメータ** | `id`: 定期エントリーID |

**REQUEST BODY** (更新したいフィールド)
```json
{
  "amount": 260000,
  "description": "毎月の給料更新"
}
```

**RESPONSE (200 OK / 404 Not Found)**
```json
{
  "id": "reg_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "amount": 260000,
  "description": "毎月の給料更新"
}
```

---

#### 6.4 定期仕訳エントリーを削除
| 項目 | 内容 |
|------|------|
| **Routing** | `/regular-journal-entries/:id` |
| **METHOD** | DELETE |
| **認証** | 必須 |
| **URL パラメータ** | `id`: 定期エントリーID |

**RESPONSE (200 OK)**
```json
{
  "message": "Regular journal entry deleted successfully"
}
```

**エラー (404 Not Found)**
```json
{
  "error": "Regular journal entry not found"
}
```

---

#### 6.5 定期仕訳エントリーを実行
| 項目 | 内容 |
|------|------|
| **Routing** | `/regular-journal-entries/execute/:id` |
| **METHOD** | POST |
| **認証** | 必須 |
| **URL パラメータ** | `id`: 定期エントリーID |

**REQUEST BODY**
```json
{
  "amount": 250000,
  "force": false,
  "executionDate": "2024-01-15"
}
```

**フィールド説明**:
- `amount`: 金額 (オプション、デフォルト: 定期エントリーの金額)
- `force`: 既に実行済みでも強制実行するか (オプション、デフォルト: false)
- `executionDate`: 実行日 (オプション、デフォルト: 本日)

**RESPONSE (200 OK)**
```json
{
  "message": "Regular journal entry executed successfully",
  "journalEntry": {
    "id": "entry_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "user_id": "user_id",
    "date": "2024-01-15",
    "description": "給料定期分配",
    "debit_account_id": "jacc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "credit_account_id": "jacc_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "amount": 250000
  }
}
```

**エラー (400 Bad Request)**
```json
{
  "error": "Entry already executed today"
}
```

---

### 7. 貸借対照表表示（Balance Sheet View）

#### 7.1 貸借対照表を取得
| 項目 | 内容 |
|------|------|
| **Routing** | `/balance-sheet-view` |
| **METHOD** | GET |
| **認証** | 必須 |
| **クエリパラメータ** | `asOfDate`: YYYY-MM-DD形式 (オプション、デフォルト: 本日) |

**使用例**: `/balance-sheet-view?asOfDate=2024-01-31`

**RESPONSE (200 OK)**
```json
[
  {
    "user_id": "user_id",
    "account_name": "現金",
    "category": "Asset",
    "balance": 500000
  },
  {
    "user_id": "user_id",
    "account_name": "クレジットカード債務",
    "category": "Liability",
    "balance": -50000
  }
]
```

---

### 8. 損益計算書表示（Profit & Loss Statement View）

#### 8.1 損益計算書を取得
| 項目 | 内容 |
|------|------|
| **Routing** | `/profit-loss-statement-view` |
| **METHOD** | GET |
| **認証** | 必須 |
| **クエリパラメータ** | `startDate`: YYYY-MM-DD形式 (オプション、デフォルト: 月初) `endDate`: YYYY-MM-DD形式 (オプション、デフォルト: 本日) |

**使用例**: `/profit-loss-statement-view?startDate=2024-01-01&endDate=2024-01-31`

**RESPONSE (200 OK)**
```json
[
  {
    "user_id": "user_id",
    "account_name": "給与所得",
    "category": "Revenue",
    "amount": 250000
  },
  {
    "user_id": "user_id",
    "account_name": "食費",
    "category": "Expense",
    "amount": -30000
  }
]
```

---

### 9. スケジュールイベント管理（Schedule Events）

#### 9.1 すべてのスケジュールイベントを取得
| 項目 | 内容 |
|------|------|
| **Routing** | `/schedule-events` |
| **METHOD** | GET |
| **認証** | 必須 |

**RESPONSE (200 OK)**
```json
[
  {
    "event_id": "event_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "user_id": "user_id",
    "title": "給料日",
    "all_day_flg": true,
    "start_date": "2024-01-15",
    "start_time": null,
    "end_date": "2024-01-15",
    "end_time": null,
    "description": "給料の入金予定日",
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "event_id": "event_yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "user_id": "user_id",
    "title": "クレジットカード支払い",
    "all_day_flg": false,
    "start_date": "2024-01-20",
    "start_time": "14:00:00",
    "end_date": "2024-01-20",
    "end_time": "15:00:00",
    "description": "クレジットカード支払い予定",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

#### 9.2 新規スケジュールイベントを作成
| 項目 | 内容 |
|------|------|
| **Routing** | `/schedule-events` |
| **METHOD** | POST |
| **認証** | 必須 |

**REQUEST BODY** (終日イベントの例)
```json
{
  "title": "給料日",
  "all_day_flg": true,
  "start_date": "2024-01-15",
  "end_date": "2024-01-15",
  "description": "給料の入金予定日"
}
```

**REQUEST BODY** (時間指定イベントの例)
```json
{
  "title": "クレジットカード支払い",
  "all_day_flg": false,
  "start_date": "2024-01-20",
  "start_time": "14:00:00",
  "end_date": "2024-01-20",
  "end_time": "15:00:00",
  "description": "クレジットカード支払い予定"
}
```

**必須フィールド**: `title`, `all_day_flg`, `start_date`, `end_date`

**条件付き必須フィールド**:
- `all_day_flg: false` の場合: `start_time`, `end_time` が必須

**RESPONSE (201 Created)**
```json
{
  "event_id": "event_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "title": "給料日",
  "all_day_flg": true,
  "start_date": "2024-01-15",
  "start_time": null,
  "end_date": "2024-01-15",
  "end_time": null,
  "description": "給料の入金予定日",
  "created_at": "2024-01-15T12:00:00Z"
}
```

---

#### 9.3 スケジュールイベントを更新
| 項目 | 内容 |
|------|------|
| **Routing** | `/schedule-events/:id` |
| **METHOD** | PUT |
| **認証** | 必須 |
| **URL パラメータ** | `id`: イベントID |

**REQUEST BODY**
```json
{
  "title": "給料日（確定）",
  "all_day_flg": true,
  "start_date": "2024-01-15",
  "end_date": "2024-01-15",
  "description": "給料の入金予定日（確定版）"
}
```

**必須フィールド**: `title`, `all_day_flg`, `start_date`, `end_date`

**バリデーション**:
- `title` は100文字以下
- `start_date` は `end_date` より前必須
- `all_day_flg: true` の場合、`start_time` と `end_time` があってはいけない
- `all_day_flg: false` の場合、`start_time` と `end_time` が必須

**RESPONSE (200 OK)**
```json
{
  "event_id": "event_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "user_id": "user_id",
  "title": "給料日（確定）",
  "all_day_flg": true,
  "start_date": "2024-01-15",
  "start_time": null,
  "end_date": "2024-01-15",
  "end_time": null,
  "description": "給料の入金予定日（確定版）"
}
```

**エラー (404 Not Found)**
```json
{
  "error": "Event not found"
}
```

---

#### 9.4 スケジュールイベントを削除
| 項目 | 内容 |
|------|------|
| **Routing** | `/schedule-events/:id` |
| **METHOD** | DELETE |
| **認証** | 必須 |
| **URL パラメータ** | `id`: イベントID |

**RESPONSE (200 OK)**
```json
{
  "message": "Event deleted",
  "deletedEvent": {
    "event_id": "event_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "user_id": "user_id",
    "title": "給料日",
    "all_day_flg": true,
    "start_date": "2024-01-15",
    "start_time": null,
    "end_date": "2024-01-15",
    "end_time": null,
    "description": "給料の入金予定日",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**エラー (404 Not Found)**
```json
{
  "error": "Event not found"
}
```

---

## ヘルスチェック

#### ヘルスチェック
| 項目 | 内容 |
|------|------|
| **Routing** | `/health` |
| **METHOD** | GET |
| **認証** | 不要 |

**RESPONSE (200 OK)**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "env": "development"
}
```

---

## エラーハンドリング

すべてのエラーレスポンスは以下の形式です：

```json
{
  "error": "エラーメッセージ"
}
```

**一般的なステータスコード**:
- `200 OK`: リクエスト成功
- `201 Created`: リソース作成成功
- `400 Bad Request`: リクエスト形式が不正
- `404 Not Found`: リソースが見つからない
- `500 Internal Server Error`: サーバー内部エラー

---

## 認証について

すべてのAPI エンドポイント（ヘルスチェック除く）にアクセスする際、`authMiddleware` を通す必要があります。認証情報はリクエストから抽出され、`req.user?.id` としてユーザーID を取得します。

---

## 日付時刻形式

- **日付**: YYYY-MM-DD (ISO 8601)
- **時刻**: HH:MM:SS (24時間形式)
- **タイムスタンプ**: ISO 8601形式 (2024-01-15T12:00:00Z)

---

## 更新日時

最終更新: 2026-02-28
