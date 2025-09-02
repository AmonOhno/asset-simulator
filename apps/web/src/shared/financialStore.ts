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
} from './types';

// 開発環境と本番環境で異なるAPI URLを使用
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

// ヘルパ�E関数�E�スネ�Eクケースからキャメルケースへ変換
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
  journalAccounts: JournalAccount[];

  // Transaction Data
  journalEntries: JournalEntry[];

  // Report Data
  balanceSheet: BalanceSheet | null;
  profitAndLoss: ProfitAndLossStatement | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  // Master Data
  setAccounts: (accounts: Account[]) => void;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  fetchAccounts: () => Promise<void>;

  setCreditCards: (creditCards: CreditCard[]) => void;
  addCreditCard: (creditCard: Omit<CreditCard, 'id'>) => Promise<void>;
  updateCreditCard: (id: string, creditCard: Partial<CreditCard>) => Promise<void>;
  deleteCreditCard: (id: string) => Promise<void>;
  fetchCreditCards: () => Promise<void>;

  setJournalAccounts: (journalAccounts: JournalAccount[]) => void;
  addJournalAccount: (journalAccount: Omit<JournalAccount, 'id'>) => Promise<void>;
  updateJournalAccount: (id: string, journalAccount: Partial<JournalAccount>) => Promise<void>;
  deleteJournalAccount: (id: string) => Promise<void>;
  fetchJournalAccounts: () => Promise<void>;

  // Transaction Data
  setJournalEntries: (journalEntries: JournalEntry[]) => void;
  addJournalEntry: (journalEntry: Omit<JournalEntry, 'id'>) => Promise<void>;
  updateJournalEntry: (id: string, journalEntry: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  fetchJournalEntries: () => Promise<void>;

  // Report Data
  generateBalanceSheet: (date: string) => Promise<void>;
  generateProfitAndLoss: (startDate: string, endDate: string) => Promise<void>;

  // Utility Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// API呼び出し�Eルパ�E関数
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return toCamelCase(data);
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// --- ストアの実裁E---

const createFinancialSlice: StateCreator<FinancialState> = (set, get) => ({
  // Initial State
  accounts: [],
  creditCards: [],
  journalAccounts: [],
  journalEntries: [],
  balanceSheet: null,
  profitAndLoss: null,
  isLoading: false,
  error: null,

  // Master Data Actions
  setAccounts: (accounts) => set({ accounts }),
  
  addAccount: async (account) => {
    set({ isLoading: true, error: null });
    try {
      const newAccount = await apiCall('/accounts', {
        method: 'POST',
        body: JSON.stringify(toSnakeCase(account)),
      });
      set((state) => ({
        accounts: [...state.accounts, newAccount],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  updateAccount: async (id, account) => {
    set({ isLoading: true, error: null });
    try {
      const updatedAccount = await apiCall(`/accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toSnakeCase(account)),
      });
      set((state) => ({
        accounts: state.accounts.map(a => a.id === id ? updatedAccount : a),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  deleteAccount: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiCall(`/accounts/${id}`, {
        method: 'DELETE',
      });
      set((state) => ({
        accounts: state.accounts.filter(a => a.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await apiCall('/accounts');
      set({ accounts, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  setCreditCards: (creditCards) => set({ creditCards }),
  
  addCreditCard: async (creditCard) => {
    set({ isLoading: true, error: null });
    try {
      const newCreditCard = await apiCall('/credit-cards', {
        method: 'POST',
        body: JSON.stringify(toSnakeCase(creditCard)),
      });
      set((state) => ({
        creditCards: [...state.creditCards, newCreditCard],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  updateCreditCard: async (id, creditCard) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCreditCard = await apiCall(`/credit-cards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toSnakeCase(creditCard)),
      });
      set((state) => ({
        creditCards: state.creditCards.map(c => c.id === id ? updatedCreditCard : c),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  deleteCreditCard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiCall(`/credit-cards/${id}`, {
        method: 'DELETE',
      });
      set((state) => ({
        creditCards: state.creditCards.filter(c => c.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  fetchCreditCards: async () => {
    set({ isLoading: true, error: null });
    try {
      const creditCards = await apiCall('/credit-cards');
      set({ creditCards, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  setJournalAccounts: (journalAccounts) => set({ journalAccounts }),
  
  addJournalAccount: async (journalAccount) => {
    set({ isLoading: true, error: null });
    try {
      const newJournalAccount = await apiCall('/journal-accounts', {
        method: 'POST',
        body: JSON.stringify(toSnakeCase(journalAccount)),
      });
      set((state) => ({
        journalAccounts: [...state.journalAccounts, newJournalAccount],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  updateJournalAccount: async (id, journalAccount) => {
    set({ isLoading: true, error: null });
    try {
      const updatedJournalAccount = await apiCall(`/journal-accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toSnakeCase(journalAccount)),
      });
      set((state) => ({
        journalAccounts: state.journalAccounts.map(j => j.id === id ? updatedJournalAccount : j),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  deleteJournalAccount: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiCall(`/journal-accounts/${id}`, {
        method: 'DELETE',
      });
      set((state) => ({
        journalAccounts: state.journalAccounts.filter(j => j.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  fetchJournalAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const journalAccounts = await apiCall('/journal-accounts');
      set({ journalAccounts, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  // Transaction Data Actions
  setJournalEntries: (journalEntries) => set({ journalEntries }),
  
  addJournalEntry: async (journalEntry) => {
    set({ isLoading: true, error: null });
    try {
      const newJournalEntry = await apiCall('/journal-entries', {
        method: 'POST',
        body: JSON.stringify(toSnakeCase(journalEntry)),
      });
      set((state) => ({
        journalEntries: [...state.journalEntries, newJournalEntry],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  updateJournalEntry: async (id, journalEntry) => {
    set({ isLoading: true, error: null });
    try {
      const updatedJournalEntry = await apiCall(`/journal-entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toSnakeCase(journalEntry)),
      });
      set((state) => ({
        journalEntries: state.journalEntries.map(j => j.id === id ? updatedJournalEntry : j),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  deleteJournalEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiCall(`/journal-entries/${id}`, {
        method: 'DELETE',
      });
      set((state) => ({
        journalEntries: state.journalEntries.filter(j => j.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  fetchJournalEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const journalEntries = await apiCall('/journal-entries');
      set({ journalEntries, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  // Report Data Actions
  generateBalanceSheet: async (date) => {
    set({ isLoading: true, error: null });
    try {
      const balanceSheet = await apiCall(`/reports/balance-sheet?date=${date}`);
      set({ balanceSheet, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  generateProfitAndLoss: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const profitAndLoss = await apiCall(`/reports/profit-and-loss?start_date=${startDate}&end_date=${endDate}`);
      set({ profitAndLoss, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false 
      });
    }
  },

  // Utility Actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
});

// Create the store
export const useFinancialStore = create<FinancialState>(createFinancialSlice);
