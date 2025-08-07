// src/types/common.ts

// --- マスタデータ定義 ---

/**
 * 金融口座のマスタデータ
 * 銀行口座、証券口座など、資産の保管場所を定義します。
 */
export interface Account {
  id: string; // 一意のID (例: acc_123)
  name: string; // 口座名 (例: 「三菱UFJ銀行」)
  institution: string; // 金融機関 (例: 「三菱UFJ銀行」)
  branchNumber: string; // 支店番号
  type: 'savings' | 'checking' | 'investment' | 'other'; // 種別
  accountNumber: string; // 口座番号
  accountHolder: string; // 口座名義人
}

/**
 * クレジットカードのマスタデータ
 * 支払い手段としてのクレジットカードを定義します。
 */
export interface CreditCard {
  id: string; // 一意のID (例: card_abc)
  name: string; // カード名 (例: 「楽天カード」)
  closingDay: number; // 締め日 (1-31)
  paymentDay: number; // 支払日 (1-31)
  linkedAccountId: string; // 引落口座のID
}

// --- 勘定科目関連 ---

/**
 * 勘定科目のカテゴリ
 */
export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

/**
 * 勘定科目の定義
 * ユーザーが仕訳で選択する科目です。
 */
export interface JournalAccount {
  id: string; 
  name: string; 
  category: AccountCategory;
  balance: number;
}

// --- 仕訳データ定義 ---

/**
 * 仕訳（ジャーナルエントリー）の定義
 */
export interface JournalEntry {
  id: string; // 一意のID
  date: string; // 取引日 (YYYY-MM-DD)
  description: string; // 摘要
  debitAccountId: string; // 借方勘定科目のID (JournalAccount.id)
  creditAccountId: string; // 貸方勘定科目のID (JournalAccount.id)
  amount: number; // 金額
}

// --- 財務レポート ---
export interface BalanceSheetItem {
  accountName: string;
  amount: number;
}

export interface BalanceSheet {
  assets: BalanceSheetItem[];
  liabilities: BalanceSheetItem[];
  equity: BalanceSheetItem[];
  totalAssets: number;
  totalLiabilitiesAndEquity: number;
}

export interface ProfitAndLossStatement {
  revenues: BalanceSheetItem[];
  expenses: BalanceSheetItem[];
  netIncome: number;
}
