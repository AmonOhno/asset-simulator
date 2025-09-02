import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import {
  Account,
  CreditCard,
  JournalAccount,
  JournalEntry,
  BalanceSheet,
  ProfitAndLossStatement,
  BalanceSheetItem,
} from '../types/common';

const API_URL: string =
  process.env.NODE_ENV !== 'production'
    ? 'http://localhost:3001/api'
    : 'https://asset-simulator-7sgj.onrender.com/api';

// ヘルパー関数：キャメルケースからスネークケースへ変換
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: { [key: string]: any }, key: string) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {});
  } else {
    return obj;
  }
};

// ヘルパー関数：スネークケースからキャメルケースへ変換
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: { [key: string]: any }, key: string) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {});
  } else {
    return obj;
  }
};

// --- ストアの型定義 ---

interface FinancialState {
  // Master Data
  accounts: Account[];
  creditCards: CreditCard[];
  journalAccounts: JournalAccount[]; // 勘定科目リスト

  // Journal Entries
  journalEntries: JournalEntry[];

  // Actions
  fetchData: () => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
  addJournalAccount: (account: Omit<JournalAccount, 'id'>) => Promise<void>;
  addJournalEntry: (entry: JournalEntry) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  updateCreditCard: (card: CreditCard) => Promise<void>;
  updateJournalAccount: (account: JournalAccount) => Promise<void>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;

  // Calculation Getters
  calculateBalanceSheet: (asOfDate?: string) => BalanceSheet;
  calculateProfitAndLossStatement: (startDate?: string, endDate?: string) => ProfitAndLossStatement;
}

// --- Zustandストアの作成 ---

const financialStore: StateCreator<FinancialState> = (set, get) => ({
  // --- STATE ---
  accounts: [],
  creditCards: [],
  journalAccounts: [],
  journalEntries: [],

  // --- ACTIONS ---

// ...existing code...

  fetchData: async (): Promise<void> => {
    try {
      const [
        accountsResponse,
        creditCardsResponse,
        journalAccountsResponse,
        journalEntriesResponse
      ] = await Promise.all([
        fetch(`${API_URL}/accounts`),
        fetch(`${API_URL}/credit-cards`),
        fetch(`${API_URL}/journal-accounts`),
        fetch(`${API_URL}/journal-entries`)
      ]);

      const accounts = accountsResponse.ok ? toCamelCase(await accountsResponse.json()) : [];
      const creditCards = creditCardsResponse.ok ? toCamelCase(await creditCardsResponse.json()) : [];
      const journalAccounts = journalAccountsResponse.ok ? toCamelCase(await journalAccountsResponse.json()) : [];
      const journalEntries = journalEntriesResponse.ok ? toCamelCase(await journalEntriesResponse.json()) : [];

      set({
        accounts: accounts || [],
        creditCards: creditCards || [],
        journalAccounts: journalAccounts || [],
        journalEntries: journalEntries || [],
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  },

  addAccount: async (account: Omit<Account, 'id'>): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(account)),
      });
      if (!response.ok) {
        throw new Error('Failed to add account');
      }
      const newAccount = toCamelCase(await response.json());
      set((state: FinancialState) => ({
        accounts: [...state.accounts, newAccount],
        journalAccounts: [...state.journalAccounts, { ...newAccount, category: 'Asset' }],
      }));
    } catch (error) {
      console.error("Failed to add account:", error);
    }
  },

  addCreditCard: async (card: Omit<CreditCard, 'id'>): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/credit-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(card)),
      });
      if (!response.ok) {
        throw new Error('Failed to add credit card');
      }
      const newCard = toCamelCase(await response.json());
      set((state) => ({
        creditCards: [...state.creditCards, newCard],
        journalAccounts: [...state.journalAccounts, { ...newCard, category: 'Liability' }],
      }));
    } catch (error) {
      console.error("Failed to add credit card:", error);
    }
  },

  addJournalAccount: async (account: Omit<JournalAccount, 'id'>): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/journal-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      if (!response.ok) {
        throw new Error('Failed to add journal account');
      }
      const newAccount = await response.json();
      set((state) => ({ journalAccounts: [...state.journalAccounts, newAccount] }));
    } catch (error) {
      console.error("Failed to add journal account:", error);
    }
  },

  updateAccount: async (account: Account): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(account)),
      });
      if (!response.ok) {
        throw new Error('Failed to update account');
      }
      const updatedAccount = toCamelCase(await response.json());
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)),
        journalAccounts: state.journalAccounts.map((ja) => (ja.id === updatedAccount.id ? { ...ja, name: updatedAccount.name } : ja)),
      }));
    } catch (error) {
      console.error("Failed to update account:", error);
    }
  },

  updateCreditCard: async (card: CreditCard): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/credit-cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(card)),
      });
      if (!response.ok) {
        throw new Error('Failed to update credit card');
      }
      const updatedCard = toCamelCase(await response.json());
      set((state) => ({
        creditCards: state.creditCards.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
        journalAccounts: state.journalAccounts.map((ja) => (ja.id === updatedCard.id ? { ...ja, name: updatedCard.name } : ja)),
      }));
    } catch (error) {
      console.error("Failed to update credit card:", error);
    }
  },

  updateJournalAccount: async (account: JournalAccount): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/journal-accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      if (!response.ok) {
        throw new Error('Failed to update journal account');
      }
      const updatedAccount = await response.json();
      set((state) => ({
        journalAccounts: state.journalAccounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)),
      }));
    } catch (error) {
      console.error("Failed to update journal account:", error);
    }
  },

  addJournalEntry: async (journalEntry: JournalEntry): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/journal-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(journalEntry)),
      });
      if (!response.ok) {
        throw new Error('Failed to add journal entry');
      }
      const newJournalEntry = toCamelCase(await response.json());
      set((state) => ({ 
        journalEntries: [...state.journalEntries, newJournalEntry]
      }));
    } catch (error) {
      console.error("Failed to add journal entry:", error);
    }
  },

  updateJournalEntry: async (journalEntry: JournalEntry): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/journal-entries/${journalEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSnakeCase(journalEntry)),
      });
      if (!response.ok) {
        throw new Error('Failed to update journal entry');
      }
      const updatedJournalEntry = toCamelCase(await response.json());
      set((state) => ({
        journalEntries: state.journalEntries.map((entry) => 
          entry.id === updatedJournalEntry.id ? updatedJournalEntry : entry
        ),
      }));
    } catch (error) {
      console.error("Failed to update journal entry:", error);
    }
  },
  // --- GETTERS (Calculations) ---

  /**
   * 貸借対照表（BS）を計算
   */
  calculateBalanceSheet: (asOfDate?: string): BalanceSheet => {
    const { journalEntries, journalAccounts } = get();
    const accountBalances = new Map<string, number>();

    // 期間でフィルタリング
    const filteredEntries = asOfDate 
      ? journalEntries.filter(entry => entry.date <= asOfDate)
      : journalEntries;

    // 各勘定科目の残高を計算
    filteredEntries.forEach((entry: JournalEntry) => {
      accountBalances.set(
        entry.debitAccountId,
        (accountBalances.get(entry.debitAccountId) || 0) + entry.amount
      );
      accountBalances.set(
        entry.creditAccountId,
        (accountBalances.get(entry.creditAccountId) || 0) - entry.amount
      );
    });

    const bs: BalanceSheet = {
      assets: [],
      liabilities: [],
      equity: [],
      totalAssets: 0,
      totalLiabilitiesAndEquity: 0,
    };

    // PLを計算して当期純利益を求める（期間指定がある場合は同じ期間で計算）
    const pl = asOfDate 
      ? get().calculateProfitAndLossStatement(undefined, asOfDate)
      : get().calculateProfitAndLossStatement();
    const netIncome = pl.netIncome;

    journalAccounts.forEach((account: JournalAccount) => {
      let balance = accountBalances.get(account.id) || 0;

      // 利益剰余金に当期純利益を加算
      if (account.id === 'acc_retained_earnings') {
        balance += netIncome;
      }

      // 残高が0の科目は表示しない（ただし純資産は0でも表示）
      if (balance === 0 && account.category !== 'Equity') return;

      const item: BalanceSheetItem = {
        accountName: account.name,
        amount: balance,
      };

      switch (account.category) {
        case 'Asset':
          bs.assets.push(item);
          bs.totalAssets += item.amount;
          break;
        case 'Liability':
          // 負債は貸方残高なので、借方残高として表示するために符号を反転
          item.amount *= -1;
          bs.liabilities.push(item);
          break;
        case 'Equity':
          // 純資産は貸方残高なので、借方残高として表示するために符号を反転
          item.amount *= -1;
          bs.equity.push(item);
          break;
        default:
          break;
      }
    });

    bs.totalLiabilitiesAndEquity = bs.liabilities.reduce((sum, item) => sum + item.amount, 0) +
                                   bs.equity.reduce((sum, item) => sum + item.amount, 0);

    return bs;
  },

  /**
   * 損益計算書（PL）を計算
   */
  calculateProfitAndLossStatement: (startDate?: string, endDate?: string): ProfitAndLossStatement => {
    const { journalEntries, journalAccounts } = get();
    const accountBalances = new Map<string, number>();

    // 期間でフィルタリング
    const filteredEntries = journalEntries.filter((entry: JournalEntry) => {
      if (startDate && entry.date < startDate) return false;
      if (endDate && entry.date > endDate) return false;
      return true;
    });

    filteredEntries.forEach((entry: JournalEntry) => {
      accountBalances.set(
        entry.debitAccountId,
        (accountBalances.get(entry.debitAccountId) || 0) + entry.amount
      );
      accountBalances.set(
        entry.creditAccountId,
        (accountBalances.get(entry.creditAccountId) || 0) - entry.amount
      );
    });

    const pl: ProfitAndLossStatement = {
      revenues: [],
      expenses: [],
      netIncome: 0,
    };

    let totalRevenue = 0;
    let totalExpense = 0;

    journalAccounts.forEach((account: JournalAccount) => {
      const balance = accountBalances.get(account.id) || 0;
      if (balance === 0) return;

      const item: BalanceSheetItem = {
        accountName: account.name,
        amount: balance,
      };

      switch (account.category) {
        case 'Revenue':
          // 収益は貸方残高なので、借方残高として表示するために符号を反転
          item.amount *= -1;
          pl.revenues.push(item);
          totalRevenue += item.amount;
          break;
        case 'Expense':
          pl.expenses.push(item);
          totalExpense += item.amount;
          break;
        default:
          break;
      }
    });

    pl.netIncome = totalRevenue - totalExpense;
    return pl;
  },
});

export const useFinancialStore = create<FinancialState>(financialStore);
