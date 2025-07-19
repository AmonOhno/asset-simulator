import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import {
  Account,
  CreditCard,
  JournalAccount,
  JournalEntry,
  BalanceSheet,
  ProfitAndLossStatement,
  BalanceSheetItem,
} from '../types/common';


const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_KEY!
);

const API_URL = 'http://localhost:3001/api';

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

  // Calculation Getters
  calculateBalanceSheet: () => BalanceSheet;
  calculateProfitAndLossStatement: () => ProfitAndLossStatement;
}

// --- Zustandストアの作成 ---

export const useFinancialStore = create<FinancialState>((set, get) => ({
  // --- STATE ---
  accounts: [],
  creditCards: [],
  journalAccounts: [],
  journalEntries: [],

  // --- ACTIONS ---

// ...existing code...

  fetchData: async () => {
    try {
      const [
        { data: accounts },
        { data: creditCards },
        { data: journalAccounts },
        { data: journalEntries }
      ] = await Promise.all([
        supabase.from('accounts').select('*'),
        supabase.from('credit_cards').select('*'),
        supabase.from('journal_accounts').select('*'),
        supabase.from('journal_entries').select(`*`)
      ]);
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

  addAccount: async (account) => {
    try {
      const response = await fetch(`${API_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      if (!response.ok) {
        throw new Error('Failed to add account');
      }
      const newAccount = await response.json();
      set((state) => ({
        accounts: [...state.accounts, newAccount],
        journalAccounts: [...state.journalAccounts, { ...newAccount, category: 'Asset' }],
      }));
    } catch (error) {
      console.error("Failed to add account:", error);
    }
  },

  addCreditCard: async (card) => {
    try {
      const response = await fetch(`${API_URL}/credit-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });
      if (!response.ok) {
        throw new Error('Failed to add credit card');
      }
      const newCard = await response.json();
      set((state) => ({
        creditCards: [...state.creditCards, newCard],
        journalAccounts: [...state.journalAccounts, { ...newCard, category: 'Liability' }],
      }));
    } catch (error) {
      console.error("Failed to add credit card:", error);
    }
  },

  addJournalAccount: async (account) => {
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

  updateAccount: async (account) => {
    try {
      const response = await fetch(`${API_URL}/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      if (!response.ok) {
        throw new Error('Failed to update account');
      }
      const updatedAccount = await response.json();
      set((state) => ({
        accounts: state.accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a)),
        journalAccounts: state.journalAccounts.map((ja) => (ja.id === updatedAccount.id ? { ...ja, name: updatedAccount.name } : ja)),
      }));
    } catch (error) {
      console.error("Failed to update account:", error);
    }
  },

  updateCreditCard: async (card) => {
    try {
      const response = await fetch(`${API_URL}/credit-cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });
      if (!response.ok) {
        throw new Error('Failed to update credit card');
      }
      const updatedCard = await response.json();
      set((state) => ({
        creditCards: state.creditCards.map((c) => (c.id === updatedCard.id ? updatedCard : c)),
        journalAccounts: state.journalAccounts.map((ja) => (ja.id === updatedCard.id ? { ...ja, name: updatedCard.name } : ja)),
      }));
    } catch (error) {
      console.error("Failed to update credit card:", error);
    }
  },

  updateJournalAccount: async (account) => {
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

  addJournalEntry: async (journalEntry) => {
    try {
      const response = await fetch(`${API_URL}/journal-entries/${journalEntry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journalEntry),
      });
      if (!response.ok) {
        throw new Error('Failed to update journal entry');
      }
      const updatedJournalEntry = await response.json();
      set((state) => ({
        journalEntries: state.journalEntries.map((a) => (a.id === updatedJournalEntry.id ? updatedJournalEntry : a)),
      }));
    } catch (error) {
      console.error("Failed to update journal account:", error);
    }
  },
  // --- GETTERS (Calculations) ---

  /**
   * 貸借対照表（BS）を計算
   */
  calculateBalanceSheet: () => {
    const { journalEntries, journalAccounts } = get();
    const accountBalances = new Map<string, number>();

    // 各勘定科目の残高を計算
    journalEntries.forEach((entry) => {
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

    // PLを計算して当期純利益を求める
    const pl = get().calculateProfitAndLossStatement();
    const netIncome = pl.netIncome;

    journalAccounts.forEach((account) => {
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
  calculateProfitAndLossStatement: () => {
    const { journalEntries, journalAccounts } = get();
    const accountBalances = new Map<string, number>();

    journalEntries.forEach((entry) => {
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

    journalAccounts.forEach((account) => {
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
}));
