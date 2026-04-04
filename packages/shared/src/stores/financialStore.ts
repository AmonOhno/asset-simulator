import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_URL, toCamelCase, toSnakeCase } from '../types/common';
import {
  Account,
  CreditCard,
  JournalAccount,
  JournalEntry,
  CalendarJournalEntry,
  BalanceSheetView,
  ProfitLossView,
  RecurringTransaction,
} from '../types/common';
import { useAuthStore } from './authStore';


// --- ストアの型定義 ---
interface FinancialState {
  // Master Data
  journalAccounts: JournalAccount[]; // 勘定科目リスト
  journalEntries: JournalEntry[];
  regularJournalEntries: RecurringTransaction[];

  // GET Actions
  fetchFinancial: () => Promise<void>; // 全データを取得
  getJournalAccounts: () => Promise<JournalAccount[]>;
  getCalendarJournalEntries: (startDate: string, endDate: string) => Promise<CalendarJournalEntry[]>; // カレンダー用VIEW
  getRegularJournalEntries: () => Promise<RecurringTransaction[]>;
  getBalanceSheetView: (asOfDate?: string) => Promise<BalanceSheetView[]>;
  getProfitLossStatementView: (startDate?: string, endDate?: string) => Promise<ProfitLossView[]>;

  // CRUD Actions
  addJournalAccount: (account: Omit<JournalAccount, 'id'>) => Promise<void>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
  addRegularJournalEntry: (entry: Omit<RecurringTransaction, 'id'>) => Promise<void>;
  updateJournalAccount: (account: JournalAccount) => Promise<void>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;
  updateRegularJournalEntry: (entry: RecurringTransaction) => Promise<void>;
  deleteJournalAccount: (account: JournalAccount) => Promise<void>;
  deleteJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteRegularJournalEntry: (entry: RecurringTransaction) => Promise<void>;
  executeRegularJournalEntry: (entry: RecurringTransaction) => Promise<void>; // 個別実行
  executeDueRegularJournalEntries: () => Promise<{executed: number, details: any[]}>; // 期限が来ている定期取引を実行
}

const financialStore: StateCreator<FinancialState> = (set, get) => {
  // Keep in-sync with auth user changes: clear or hydrate state
  useAuthStore.subscribe((s) => {
    const uid = s.userId;
    if (!uid) {
      set({
        journalAccounts: [],
        journalEntries: [],
        regularJournalEntries: [],
      });
      return;
    }
  });

  return ({
  // --- STATE ---
  journalAccounts: [],
  journalEntries: [],
  regularJournalEntries: [],

  // --- Actions ---
  fetchFinancial: async (): Promise<void> => {
    get().getJournalAccounts();
  },

  // --- CRUD Actions ---
  getJournalAccounts: async (): Promise<JournalAccount[]> => {
    const { session, userId } = useAuthStore.getState();
    if (!session || !userId) return [];

    try {
      const response = await fetch(`${API_URL}/journal-accounts`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch journal accounts');
      const journalAccounts = toCamelCase(await response.json()) || [];
      set(() => ({ journalAccounts }));
      return journalAccounts;
    } catch (error) {
      console.error('Failed to fetch journal accounts:', error);
      return get().journalAccounts;
    }
  },

  // カレンダー表示用VIEW `v_journal_entries_for_calendar` から仕訳を取得
  // 勘定科目名とカテゴリが事前に JOIN されているため、クライアント側の find() 検索が不要
  getCalendarJournalEntries: async (startDate: string, endDate: string): Promise<CalendarJournalEntry[]> => {
    const { session } = useAuthStore.getState();
    if (!session) return [];

    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      const response = await fetch(`${API_URL}/journal-entries/calendar?${params.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch calendar journal entries');
      const entries = toCamelCase(await response.json()) || [];
      return entries as CalendarJournalEntry[];
    } catch (error) {
      console.error('Failed to fetch calendar journal entries:', error);
      return [];
    }
  },

  getRegularJournalEntries: async (): Promise<RecurringTransaction[]> => {
    const { session, userId } = useAuthStore.getState();
    if (!session || !userId) return [];

    try {
      const response = await fetch(`${API_URL}/regular-journal-entries`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch regular journal entries');
      const regularJournalEntries = toCamelCase(await response.json()) || [];
      set(() => ({ regularJournalEntries }));
      return regularJournalEntries;
    } catch (error) {
      console.error('Failed to fetch regular journal entries:', error);
      return get().regularJournalEntries;
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
      const newAccount = toCamelCase(await response.json());
      const updatedJournalAccounts = [...get().journalAccounts, newAccount];
      set(() => ({ journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
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
      const updatedJournalEntries = [...get().journalEntries, newJournalEntry];
      set(() => ({ journalEntries: updatedJournalEntries }));
      const { userId } = useAuthStore.getState();
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
      const updatedRegular = [...get().regularJournalEntries, newEntry];
      set(() => ({ regularJournalEntries: updatedRegular }));
      const { userId } = useAuthStore.getState();
    } catch (error) {
      console.error("Failed to add regular journal entry:", error);
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
      const updatedAccount = toCamelCase(await response.json());
      const updatedJournalAccounts = get().journalAccounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a));
      set(() => ({ journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
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
      const updatedJournalEntries = get().journalEntries.map((entry) => entry.id === updatedJournalEntry.id ? updatedJournalEntry : entry);
      set(() => ({ journalEntries: updatedJournalEntries }));
      const { userId } = useAuthStore.getState();
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
      const updatedRegular = get().regularJournalEntries.map(e => e.id === entry.id ? updatedEntry : e);
      set(() => ({ regularJournalEntries: updatedRegular }));
      const { userId } = useAuthStore.getState();
    } catch (error) {
      console.error("Failed to update regular journal entry:", error);
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
      const updatedJournalAccounts = get().journalAccounts.filter(a => a.id !== account.id);
      set(() => ({ journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
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
      const updatedJournalEntries = get().journalEntries.filter(e => e.id !== entry.id);
      set(() => ({ journalEntries: updatedJournalEntries }));
      const { userId } = useAuthStore.getState();
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
      const updatedRegular = get().regularJournalEntries.filter(e => e.id !== entry.id);
      set(() => ({ regularJournalEntries: updatedRegular }));
      const { userId } = useAuthStore.getState();
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

  // --- VIEW Methods (Server-side Aggregation) ---
  getBalanceSheetView: async (asOfDate?: string): Promise<BalanceSheetView[]> => {
    const { session } = useAuthStore.getState();
    if (!session) return [];

    try {
      const url = new URL(`${API_URL}/balance-sheet-view`);
      if (asOfDate) url.searchParams.append('asOfDate', asOfDate);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch balance sheet view');
      const data = await response.json();
      return (Array.isArray(data) ? data : []) as BalanceSheetView[];
    } catch (error) {
      console.error('Error fetching balance sheet view:', error);
      return [];
    }
  },

  getProfitLossStatementView: async (startDate?: string, endDate?: string): Promise<ProfitLossView[]> => {
    const { session } = useAuthStore.getState();
    if (!session) return [];

    try {
      const url = new URL(`${API_URL}/profit-loss-statement-view`);
      if (startDate) url.searchParams.append('startDate', startDate);
      if (endDate) url.searchParams.append('endDate', endDate);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch profit/loss statement view');
      const data = await response.json();
      return (Array.isArray(data) ? data : []) as ProfitLossView[];
    } catch (error) {
      console.error('Error fetching profit/loss statement view:', error);
      return [];
    }
  },

});

};

export const useFinancialStore = create<FinancialState>()(
  persist(
    financialStore,
    {
      name: 'financial-store', // localStorage key
    }
  )
);