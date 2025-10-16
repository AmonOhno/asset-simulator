import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { API_URL, toCamelCase, toSnakeCase } from '../types/common';
import {
  Account,
  CreditCard,
  JournalAccount,
  JournalEntry,
  RecurringTransaction,
  BalanceSheet,
  ProfitAndLossStatement,
  BalanceSheetItem,
} from '../types/common';
import { useAuthStore } from './authStore';


// --- ストアの型定義 ---
interface FinancialState {
  // Master Data
  accounts: Account[];
  creditCards: CreditCard[];
  journalAccounts: JournalAccount[]; // 勘定科目リスト
  journalEntries: JournalEntry[];
  regularJournalEntries: RecurringTransaction[];

  // Actions
  fetchFinancial: () => Promise<void>; // 全データを取得
  calculateBalanceSheet: (asOfDate?: string) => BalanceSheet; //貸借対照表（BS）を計算
  calculateProfitAndLossStatement: (startDate?: string, endDate?: string) => ProfitAndLossStatement; //損益計算書（PL）を計算

  // CRUD Actions
  getAccounts: () => Promise<Account[]>;
  getCreditCards: () => Promise<CreditCard[]>;
  getJournalAccounts: () => Promise<JournalAccount[]>;
  getJournalEntries: () => Promise<JournalEntry[]>;
  getRegularJournalEntries: () => Promise<RecurringTransaction[]>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  addCreditCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
  addJournalAccount: (account: Omit<JournalAccount, 'id'>) => Promise<void>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
  addRegularJournalEntry: (entry: Omit<RecurringTransaction, 'id'>) => Promise<void>;
  updateAccount: (account: Account) => Promise<void>;
  updateCreditCard: (card: CreditCard) => Promise<void>;
  updateJournalAccount: (account: JournalAccount) => Promise<void>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;
  updateRegularJournalEntry: (entry: RecurringTransaction) => Promise<void>;
  deleteAccount: (account: Account) => Promise<void>;
  deleteCreditCard: (card: CreditCard) => Promise<void>;
  deleteJournalAccount: (account: JournalAccount) => Promise<void>;
  deleteJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteRegularJournalEntry: (entry: RecurringTransaction) => Promise<void>;
  executeRegularJournalEntry: (entry: RecurringTransaction) => Promise<void>; // 個別実行
  executeDueRegularJournalEntries: () => Promise<{executed: number, details: any[]}>; // 期限が来ている定期取引を実行
}

// --- Zustandストアの作成 ---
const financialStore: StateCreator<FinancialState> = (set, get) => ({
  // --- STATE ---
  accounts: [],
  creditCards: [],
  journalAccounts: [],
  journalEntries: [],
  regularJournalEntries: [],

  // --- Actions ---
  fetchFinancial: async (): Promise<void> => {
    get().getAccounts();
    get().getCreditCards();
    get().getJournalAccounts();
    get().getJournalEntries();
    get().getRegularJournalEntries();
  },

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

  // --- CRUD Actions ---
  getAccounts: async (): Promise<Account[]> => {
    const { session } = useAuthStore.getState();
    if (!session) return [];

    try {
      const response = await fetch(`${API_URL}/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const accounts = toCamelCase(await response.json());
      set((state) => ({ accounts: accounts || [] }));
      return accounts || [];
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      return get().accounts;
    }
  },

  getCreditCards: async (): Promise<CreditCard[]> => {
    const { session } = useAuthStore.getState();
    if (!session) return [];

    try {
      const response = await fetch(`${API_URL}/credit-cards`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch credit cards');
      }
      const creditCards = toCamelCase(await response.json());
      set((state) => ({ creditCards: creditCards || [] }));
      return creditCards || [];
    } catch (error) {
      console.error("Failed to fetch credit cards:", error);
      return get().creditCards;
    }
  },

  getJournalAccounts: async (): Promise<JournalAccount[]> => {
    const { session } = useAuthStore.getState();
    if (!session) return [];

    try {
      const response = await fetch(`${API_URL}/journal-accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch journal accounts');
      }
      const journalAccounts = toCamelCase(await response.json());
      set((state) => ({ journalAccounts: journalAccounts || [] }));
      return journalAccounts || [];
    } catch (error) {
      console.error("Failed to fetch journal accounts:", error);
      return get().journalAccounts;
    }
  },

  getJournalEntries: async (): Promise<JournalEntry[]> => {
    const { session } = useAuthStore.getState();
    if (!session) return [];

    try {
      const response = await fetch(`${API_URL}/journal-entries`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch journal entries');
      }
      const journalEntries = toCamelCase(await response.json());
      set((state) => ({ journalEntries: journalEntries || [] }));
      return journalEntries || [];
    } catch (error) {
      console.error("Failed to fetch journal entries:", error);
      return get().journalEntries;
    }
  },

  getRegularJournalEntries: async (): Promise<RecurringTransaction[]> => {
    const { session } = useAuthStore.getState();
    if (!session) return [];

    try {
      const response = await fetch(`${API_URL}/regular-journal-entries`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch regular journal entries');
      }
      const regularJournalEntries = toCamelCase(await response.json());
      set((state) => ({ regularJournalEntries: regularJournalEntries || [] }));
      return regularJournalEntries || [];
    } catch (error) {
      console.error("Failed to fetch regular journal entries:", error);
      return get().regularJournalEntries;
    }
  },

  addAccount: async (account: Omit<Account, 'id'>): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
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
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/credit-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
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
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/journal-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(toSnakeCase(account)),
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

  addJournalEntry: async (entry: Omit<JournalEntry, 'id'>): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/journal-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(toSnakeCase(entry)),
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

  addRegularJournalEntry: async (entry: Omit<RecurringTransaction, 'id'>): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/regular-journal-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(toSnakeCase(entry)),
      });
      if (!response.ok) {
        throw new Error('Failed to add regular journal entry');
      }
      const newEntry = toCamelCase(await response.json());
      set((state) => ({
        regularJournalEntries: [...state.regularJournalEntries, newEntry],
      }));
    } catch (error) {
      console.error("Failed to add regular journal entry:", error);
    }
  },

  updateAccount: async (account: Account): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/accounts/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
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
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/credit-cards/${card.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
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
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/journal-accounts/${account.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(toSnakeCase(account)),
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

  updateJournalEntry: async (entry: JournalEntry): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/journal-entries/${entry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(toSnakeCase(entry)),
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

  updateRegularJournalEntry: async (entry: RecurringTransaction): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/regular-journal-entries/${entry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(toSnakeCase(entry)),
      });
      if (!response.ok) {
        throw new Error('Failed to update regular journal entry');
      }
      const updatedEntry = toCamelCase(await response.json());
      set((state) => ({
        regularJournalEntries: state.regularJournalEntries.map(e => 
          e.id === entry.id ? updatedEntry : e
        ),
      }));
    } catch (error) {
      console.error("Failed to update regular journal entry:", error);
    }
  },

  deleteAccount: async (account: Account): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/accounts/${account.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      set((state) => ({
        accounts: state.accounts.filter(a => a.id !== account.id),
        journalAccounts: state.journalAccounts.filter(ja => ja.id !== account.id),
      }));
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  },

  deleteCreditCard: async (card: CreditCard): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/credit-cards/${card.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete credit card');
      }
      set((state) => ({
        creditCards: state.creditCards.filter(c => c.id !== card.id),
        journalAccounts: state.journalAccounts.filter(ja => ja.id !== card.id),
      }));
    } catch (error) {
      console.error("Failed to delete credit card:", error);
    }
  },

  deleteJournalAccount: async (account: JournalAccount): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/journal-accounts/${account.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete journal account');
      }
      set((state) => ({
        journalAccounts: state.journalAccounts.filter(a => a.id !== account.id),
      }));
    } catch (error) {
      console.error("Failed to delete journal account:", error);
    }
  },

  deleteJournalEntry: async (entry: JournalEntry): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/journal-entries/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete journal entry');
      }
      set((state) => ({
        journalEntries: state.journalEntries.filter(e => e.id !== entry.id),
      }));
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
    }
  },

  deleteRegularJournalEntry: async (entry: RecurringTransaction): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/regular-journal-entries/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete regular journal entry');
      }
      set((state) => ({
        regularJournalEntries: state.regularJournalEntries.filter(e => e.id !== entry.id),
      }));
    } catch (error) {
      console.error("Failed to delete regular journal entry:", error);
    }
  },

  executeRegularJournalEntry: async (entry: RecurringTransaction): Promise<void> => {
    const { session } = useAuthStore.getState();
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/regular-journal-entries/execute/${entry.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(toSnakeCase(entry)),});
      if (!response.ok) {
        throw new Error('Failed to execute regular journal entry');
      }
      
      // 新しい仕訳エントリと更新された定期取引を取得するため、データを再取得
      const { fetchFinancial } = get();
      await fetchFinancial();
    } catch (error) {
      console.error("Failed to execute regular journal entry:", error);
    }
  },

  executeDueRegularJournalEntries: async (): Promise<{executed: number, details: any[]}> => {
    const { session } = useAuthStore.getState();
    if (!session) return { executed: 0, details: [] };

    try {
      const response = await fetch(`${API_URL}/regular-journal-entries/execute-due`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to execute due regular journal entries');
      }
      
      const result = await response.json();
      
      // データを再取得して表示を更新
      const { fetchFinancial } = get();
      await fetchFinancial();
      
      return {
        executed: result.executed,
        details: result.details || []
      };
    } catch (error) {
      console.error("Failed to execute due regular journal entries:", error);
      throw error;
    }
  },

});

export const useFinancialStore = create<FinancialState>(financialStore);
