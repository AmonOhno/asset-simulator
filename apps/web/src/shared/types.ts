// src/types/common.ts

// --- マスタチE�Eタ定義 ---

/**
 * 金融口座のマスタチE�Eタ
 * 銀行口座、証券口座など、賁E��の保管場所を定義します、E
 */
export interface Account {
  id: string; // 一意�EID (侁E acc_123)
  name: string; // 口座吁E(侁E 「三菱UFJ銀行、E
  institution: string; // 金融機関 (侁E 「三菱UFJ銀行、E
  branchNumber: string; // 支店番号
  type: 'savings' | 'checking' | 'investment' | 'other'; // 種別
  accountNumber: string; // 口座番号
  accountHolder: string; // 口座名義人
}

/**
 * クレジチE��カード�EマスタチE�Eタ
 * 支払い手段としてのクレジチE��カードを定義します、E
 */
export interface CreditCard {
  id: string; // 一意�EID (侁E card_abc)
  name: string; // カード名 (侁E 「楽天カード、E
  closingDay: number; // 締め日 (1-31)
  paymentDay: number; // 支払日 (1-31)
  linkedAccountId: string; // 引落口座のID
}

// --- 勘定科目関連 ---

/**
 * 勘定科目のカチE��リ
 */
export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

/**
 * 勘定科目の定義
 * ユーザーが仕訳で選択する科目です、E
 */
export interface JournalAccount {
  id: string; 
  name: string; 
  category: AccountCategory;
  balance: number;
}

// --- 仕訳チE�Eタ定義 ---

/**
 * 仕訳�E�ジャーナルエントリー�E��E定義
 */
export interface JournalEntry {
  id: string; // 一意�EID
  date: string; // 取引日 (YYYY-MM-DD)
  description: string; // 摘要E
  debitAccountId: string; // 借方勘定科目のID (JournalAccount.id)
  creditAccountId: string; // 貸方勘定科目のID (JournalAccount.id)
  amount: number; // 金顁E
}

// --- 財務レポ�EチE---
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
