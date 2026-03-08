import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { API_URL, toCamelCase, toSnakeCase } from '../types/common';
import {
  Account,
  CreditCard,
  JournalAccount,
  JournalEntry,
  CalendarJournalEntry,
  BalanceSheetViewRow,
  ProfitLossViewRow,
  RecurringTransaction,
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
  getBalanceSheetView: (asOfDate?: string) => Promise<BalanceSheetViewRow[]>;
  getProfitLossStatementView: (startDate?: string, endDate?: string) => Promise<ProfitLossViewRow[]>;

  // CRUD Actions
  getAccounts: () => Promise<Account[]>;
  getCreditCards: () => Promise<CreditCard[]>;
  getJournalAccounts: () => Promise<JournalAccount[]>;
  getJournalEntries: (startDate?: string, endDate?: string) => Promise<JournalEntry[]>;
  getCalendarJournalEntries: (startDate: string, endDate: string) => Promise<CalendarJournalEntry[]>; // カレンダー用VIEW
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
// --- Per-user cache (in-memory + localStorage) ---
interface FinancialCache {
  accounts: Account[];
  creditCards: CreditCard[];
  journalAccounts: JournalAccount[];
  journalEntries: JournalEntry[];
  regularJournalEntries: RecurringTransaction[];
}

const CACHE_PREFIX = 'asset_simulator_financial_v1:';
const financialCache: Record<string, FinancialCache> = {};

const loadCacheFromStorage = (userId: string): FinancialCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + userId);
    if (!raw) return null;
    return JSON.parse(raw) as FinancialCache;
  } catch (e) {
    console.warn('Failed to load financial cache from localStorage', e);
    return null;
  }
};

const saveCacheToStorage = (userId: string, cache: FinancialCache) => {
  try {
    localStorage.setItem(CACHE_PREFIX + userId, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save financial cache to localStorage', e);
  }
};

const setCacheForUser = (userId: string, partial: Partial<FinancialCache>) => {
  const existing = financialCache[userId] ?? {
    accounts: [],
    creditCards: [],
    journalAccounts: [],
    journalEntries: [],
    regularJournalEntries: [],
  };
  const merged: FinancialCache = {
    ...existing,
    ...partial,
  } as FinancialCache;
  financialCache[userId] = merged;
  saveCacheToStorage(userId, merged);
  return merged;
};

// Subscribe to userId changes and hydrate/clear state accordingly
useAuthStore.subscribe((s) => {
  const userId = s.userId;
  if (!userId) {
    // clear in-memory runtime caches when no user
    // leave localStorage intact
    // Note: We don't have direct access to set() here, so components should call fetchFinancial after login
    return;
  }
  // hydrate from storage if available
  const stored = loadCacheFromStorage(userId);
  if (stored) {
    financialCache[userId] = stored;
  }
});

const financialStore: StateCreator<FinancialState> = (set, get) => {
  // Keep in-sync with auth user changes: clear or hydrate state
  useAuthStore.subscribe((s) => {
    const uid = s.userId;
    if (!uid) {
      set({
        accounts: [],
        creditCards: [],
        journalAccounts: [],
        journalEntries: [],
        regularJournalEntries: [],
      });
      return;
    }
    const cached = financialCache[uid] ?? loadCacheFromStorage(uid) ?? null;
    if (cached) {
      set({
        accounts: cached.accounts,
        creditCards: cached.creditCards,
        journalAccounts: cached.journalAccounts,
        journalEntries: cached.journalEntries,
        regularJournalEntries: cached.regularJournalEntries,
      });
    }
  });

  return ({
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
  },

  // --- CRUD Actions ---
  getAccounts: async (): Promise<Account[]> => {
    const { session, userId } = useAuthStore.getState();
    if (!session || !userId) return [];

    // Serve cached data immediately if present
    const cached = financialCache[userId]?.accounts;
    if (cached && cached.length > 0) {
      set(() => ({ accounts: cached }));
      // Refresh in background
      (async () => {
        try {
          const resp = await fetch(`${API_URL}/accounts`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (resp.ok) {
            const fresh = toCamelCase(await resp.json()) || [];
            set(() => ({ accounts: fresh }));
            setCacheForUser(userId, { accounts: fresh });
          }
        } catch (e) {
          console.debug('Background refresh accounts failed', e);
        }
      })();
      return cached;
    }

    try {
      const response = await fetch(`${API_URL}/accounts`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const accounts = toCamelCase(await response.json()) || [];
      set(() => ({ accounts }));
      setCacheForUser(userId, { accounts });
      return accounts;
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      return get().accounts;
    }
  },

  getCreditCards: async (): Promise<CreditCard[]> => {
    const { session, userId } = useAuthStore.getState();
    if (!session || !userId) return [];

    const cached = financialCache[userId]?.creditCards;
    if (cached && cached.length > 0) {
      set(() => ({ creditCards: cached }));
      (async () => {
        try {
          const resp = await fetch(`${API_URL}/credit-cards`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (resp.ok) {
            const fresh = toCamelCase(await resp.json()) || [];
            set(() => ({ creditCards: fresh }));
            setCacheForUser(userId, { creditCards: fresh });
          }
        } catch (e) {
          console.debug('Background refresh credit cards failed', e);
        }
      })();
      return cached;
    }

    try {
      const response = await fetch(`${API_URL}/credit-cards`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch credit cards');
      const creditCards = toCamelCase(await response.json()) || [];
      set(() => ({ creditCards }));
      setCacheForUser(userId, { creditCards });
      return creditCards;
    } catch (error) {
      console.error('Failed to fetch credit cards:', error);
      return get().creditCards;
    }
  },

  getJournalAccounts: async (): Promise<JournalAccount[]> => {
    const { session, userId } = useAuthStore.getState();
    if (!session || !userId) return [];

    const cached = financialCache[userId]?.journalAccounts;
    if (cached && cached.length > 0) {
      set(() => ({ journalAccounts: cached }));
      (async () => {
        try {
          const resp = await fetch(`${API_URL}/journal-accounts`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (resp.ok) {
            const fresh = toCamelCase(await resp.json()) || [];
            set(() => ({ journalAccounts: fresh }));
            setCacheForUser(userId, { journalAccounts: fresh });
          }
        } catch (e) {
          console.debug('Background refresh journal accounts failed', e);
        }
      })();
      return cached;
    }

    try {
      const response = await fetch(`${API_URL}/journal-accounts`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch journal accounts');
      const journalAccounts = toCamelCase(await response.json()) || [];
      set(() => ({ journalAccounts }));
      setCacheForUser(userId, { journalAccounts });
      return journalAccounts;
    } catch (error) {
      console.error('Failed to fetch journal accounts:', error);
      return get().journalAccounts;
    }
  },

  getJournalEntries: async (startDate?: string, endDate?: string): Promise<JournalEntry[]> => {
    const { session, userId } = useAuthStore.getState();
    if (!session || !userId) return [];

    // 期間指定がない場合はキャッシュを使用
    if (!startDate && !endDate) {
      const cached = financialCache[userId]?.journalEntries;
      if (cached && cached.length > 0) {
        set(() => ({ journalEntries: cached }));
        (async () => {
          try {
            const resp = await fetch(`${API_URL}/journal-entries`, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (resp.ok) {
              const fresh = toCamelCase(await resp.json()) || [];
              set(() => ({ journalEntries: fresh }));
              setCacheForUser(userId, { journalEntries: fresh });
            }
          } catch (e) {
            console.debug('Background refresh journal entries failed', e);
          }
        })();
        return cached;
      }

      try {
        const response = await fetch(`${API_URL}/journal-entries`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch journal entries');
        const journalEntries = toCamelCase(await response.json()) || [];
        set(() => ({ journalEntries }));
        setCacheForUser(userId, { journalEntries });
        return journalEntries;
      } catch (error) {
        console.error('Failed to fetch journal entries:', error);
        return get().journalEntries;
      }
    }

    // 期間指定がある場合は直接取得（キャッシュなし）
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`${API_URL}/journal-entries?${params.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch journal entries for period');
      const journalEntries = toCamelCase(await response.json()) || [];
      return journalEntries;
    } catch (error) {
      console.error('Failed to fetch journal entries for period:', error);
      return [];
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

    const cached = financialCache[userId]?.regularJournalEntries;
    if (cached && cached.length > 0) {
      set(() => ({ regularJournalEntries: cached }));
      (async () => {
        try {
          const resp = await fetch(`${API_URL}/regular-journal-entries`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (resp.ok) {
            const fresh = toCamelCase(await resp.json()) || [];
            set(() => ({ regularJournalEntries: fresh }));
            setCacheForUser(userId, { regularJournalEntries: fresh });
          }
        } catch (e) {
          console.debug('Background refresh regular journal entries failed', e);
        }
      })();
      return cached;
    }

    try {
      const response = await fetch(`${API_URL}/regular-journal-entries`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch regular journal entries');
      const regularJournalEntries = toCamelCase(await response.json()) || [];
      set(() => ({ regularJournalEntries }));
      setCacheForUser(userId, { regularJournalEntries });
      return regularJournalEntries;
    } catch (error) {
      console.error('Failed to fetch regular journal entries:', error);
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
      const updatedAccounts = [...get().accounts, newAccount];
      const updatedJournalAccounts = [...get().journalAccounts, { ...newAccount, category: 'Asset' }];
      set(() => ({
        accounts: updatedAccounts,
        journalAccounts: updatedJournalAccounts,
      }));
      const { userId } = useAuthStore.getState();
      if (userId) setCacheForUser(userId, { accounts: updatedAccounts, journalAccounts: updatedJournalAccounts });
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
      const updatedCards = [...get().creditCards, newCard];
      const updatedJournalAccounts = [...get().journalAccounts, { ...newCard, category: 'Liability' }];
      set(() => ({
        creditCards: updatedCards,
        journalAccounts: updatedJournalAccounts,
      }));
      const { userId } = useAuthStore.getState();
      if (userId) setCacheForUser(userId, { creditCards: updatedCards, journalAccounts: updatedJournalAccounts });
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
      const newAccount = toCamelCase(await response.json());
      const updatedJournalAccounts = [...get().journalAccounts, newAccount];
      set(() => ({ journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
      if (userId) setCacheForUser(userId, { journalAccounts: updatedJournalAccounts });
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
      if (userId) setCacheForUser(userId, { journalEntries: updatedJournalEntries });
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
      if (userId) setCacheForUser(userId, { regularJournalEntries: updatedRegular });
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
      const updatedAccounts = get().accounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a));
      const updatedJournalAccounts = get().journalAccounts.map((ja) => (ja.id === updatedAccount.id ? { ...ja, name: updatedAccount.name } : ja));
      set(() => ({ accounts: updatedAccounts, journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
      if (userId) setCacheForUser(userId, { accounts: updatedAccounts, journalAccounts: updatedJournalAccounts });
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
      const updatedCards = get().creditCards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
      const updatedJournalAccounts = get().journalAccounts.map((ja) => (ja.id === updatedCard.id ? { ...ja, name: updatedCard.name } : ja));
      set(() => ({ creditCards: updatedCards, journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
      if (userId) setCacheForUser(userId, { creditCards: updatedCards, journalAccounts: updatedJournalAccounts });
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
      const updatedAccount = toCamelCase(await response.json());
      const updatedJournalAccounts = get().journalAccounts.map((a) => (a.id === updatedAccount.id ? updatedAccount : a));
      set(() => ({ journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
      if (userId) setCacheForUser(userId, { journalAccounts: updatedJournalAccounts });
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
      if (userId) setCacheForUser(userId, { journalEntries: updatedJournalEntries });
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
      if (userId) setCacheForUser(userId, { regularJournalEntries: updatedRegular });
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
      const updatedAccounts = get().accounts.filter(a => a.id !== account.id);
      const updatedJournalAccounts = get().journalAccounts.filter(ja => ja.id !== account.id);
      set(() => ({ accounts: updatedAccounts, journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
      if (userId) setCacheForUser(userId, { accounts: updatedAccounts, journalAccounts: updatedJournalAccounts });
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
      const updatedCards = get().creditCards.filter(c => c.id !== card.id);
      const updatedJournalAccounts = get().journalAccounts.filter(ja => ja.id !== card.id);
      set(() => ({ creditCards: updatedCards, journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
      if (userId) setCacheForUser(userId, { creditCards: updatedCards, journalAccounts: updatedJournalAccounts });
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
      const updatedJournalAccounts = get().journalAccounts.filter(a => a.id !== account.id);
      set(() => ({ journalAccounts: updatedJournalAccounts }));
      const { userId } = useAuthStore.getState();
      if (userId) setCacheForUser(userId, { journalAccounts: updatedJournalAccounts });
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
      if (userId) setCacheForUser(userId, { journalEntries: updatedJournalEntries });
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
      if (userId) setCacheForUser(userId, { regularJournalEntries: updatedRegular });
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
  getBalanceSheetView: async (asOfDate?: string): Promise<BalanceSheetViewRow[]> => {
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
      return (Array.isArray(data) ? data : []) as BalanceSheetViewRow[];
    } catch (error) {
      console.error('Error fetching balance sheet view:', error);
      return [];
    }
  },

  getProfitLossStatementView: async (startDate?: string, endDate?: string): Promise<ProfitLossViewRow[]> => {
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
      return (Array.isArray(data) ? data : []) as ProfitLossViewRow[];
    } catch (error) {
      console.error('Error fetching profit/loss statement view:', error);
      return [];
    }
  },

});

};

export const useFinancialStore = create<FinancialState>(financialStore);
