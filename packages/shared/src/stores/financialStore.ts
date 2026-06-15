import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { toCamelCase, toSnakeCase } from '../utils/caseConvert';
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
import { useAuthStore, supabase } from './authStore';


// --- ストアの型定義 ---
interface FinancialState {
  // Master Data
  journalAccounts: JournalAccount[]; // 勘定科目リスト
  journalEntries: JournalEntry[];
  regularJournalEntries: RecurringTransaction[];

  // GET Actions
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

  // --- CRUD Actions ---
  getJournalAccounts: async (): Promise<JournalAccount[]> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('journal_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      const journalAccounts = toCamelCase(data || []);
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
    const { userId } = useAuthStore.getState();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('v_journal_entries_for_calendar')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      if (error) throw error;
      return toCamelCase(data || []) as CalendarJournalEntry[];
    } catch (error) {
      console.error('Failed to fetch calendar journal entries:', error);
      return [];
    }
  },

  getRegularJournalEntries: async (): Promise<RecurringTransaction[]> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('regular_journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      const regularJournalEntries = toCamelCase(data || []);
      set(() => ({ regularJournalEntries }));
      return regularJournalEntries;
    } catch (error) {
      console.error('Failed to fetch regular journal entries:', error);
      return get().regularJournalEntries;
    }
  },

  addJournalAccount: async (account: Omit<JournalAccount, 'id'>): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const newAccount = {
        id: `jacc_${crypto.randomUUID()}`,
        name: account.name,
        category: account.category,
        user_id: userId,
      };
      const { data, error } = await supabase
        .from('journal_accounts')
        .insert([newAccount])
        .select()
        .single();
      if (error) throw error;
      const added = toCamelCase(data);
      set(() => ({ journalAccounts: [...get().journalAccounts, added] }));
    } catch (error) {
      console.error("Failed to add journal account:", error);
    }
  },

  addJournalEntry: async (entry: Omit<JournalEntry, 'id'>): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const entryId = `entry_${crypto.randomUUID()}`;
      const amount = parseFloat(String(entry.amount));
      const rpcEntryData = {
        id: entryId,
        date: entry.date,
        description: entry.description,
        debitAccountId: entry.debitAccountId,
        creditAccountId: entry.creditAccountId,
        amount,
        user_id: userId,
      };
      const { error } = await supabase.rpc('create_journal_entry', {
        entry_data: rpcEntryData,
        update_balances: true,
      });
      if (error) throw error;
      const newEntry = toCamelCase({
        id: entryId,
        date: entry.date,
        description: entry.description,
        debit_account_id: entry.debitAccountId,
        credit_account_id: entry.creditAccountId,
        amount,
        user_id: userId,
      });
      set(() => ({ journalEntries: [...get().journalEntries, newEntry] }));
    } catch (error) {
      console.error("Failed to add journal entry:", error);
    }
  },

  addRegularJournalEntry: async (entry: Omit<RecurringTransaction, 'id'>): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const newEntry = {
        ...toSnakeCase(entry),
        id: `reg_${crypto.randomUUID()}`,
        user_id: userId,
      };
      const { data, error } = await supabase
        .from('regular_journal_entries')
        .insert(newEntry)
        .select()
        .single();
      if (error) throw error;
      const added = toCamelCase(data);
      set(() => ({ regularJournalEntries: [...get().regularJournalEntries, added] }));
    } catch (error) {
      console.error("Failed to add regular journal entry:", error);
    }
  },

  updateJournalAccount: async (account: JournalAccount): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('journal_accounts')
        .update({ name: account.name, category: account.category })
        .eq('id', account.id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      const updated = toCamelCase(data);
      set(() => ({
        journalAccounts: get().journalAccounts.map((a) => a.id === updated.id ? updated : a),
      }));
    } catch (error) {
      console.error("Failed to update journal account:", error);
    }
  },

  updateJournalEntry: async (entry: JournalEntry): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update({
          date: entry.date,
          description: entry.description,
          debit_account_id: entry.debitAccountId,
          credit_account_id: entry.creditAccountId,
          amount: parseFloat(String(entry.amount)),
        })
        .eq('id', entry.id)
        .eq('user_id', userId)
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        const updated = toCamelCase(data[0]);
        set(() => ({
          journalEntries: get().journalEntries.map((e) => e.id === updated.id ? updated : e),
        }));
      }
    } catch (error) {
      console.error("Failed to update journal entry:", error);
    }
  },

  updateRegularJournalEntry: async (entry: RecurringTransaction): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('regular_journal_entries')
        .update(toSnakeCase(entry))
        .eq('id', entry.id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      const updated = toCamelCase(data);
      set(() => ({
        regularJournalEntries: get().regularJournalEntries.map((e) => e.id === entry.id ? updated : e),
      }));
    } catch (error) {
      console.error("Failed to update regular journal entry:", error);
    }
  },

  deleteJournalAccount: async (account: JournalAccount): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('journal_accounts')
        .delete()
        .eq('id', account.id)
        .eq('user_id', userId);
      if (error) throw error;
      set(() => ({
        journalAccounts: get().journalAccounts.filter((a) => a.id !== account.id),
      }));
    } catch (error) {
      console.error("Failed to delete journal account:", error);
    }
  },

  deleteJournalEntry: async (entry: JournalEntry): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entry.id)
        .eq('user_id', userId);
      if (error) throw error;
      set(() => ({
        journalEntries: get().journalEntries.filter((e) => e.id !== entry.id),
      }));
    } catch (error) {
      console.error("Failed to delete journal entry:", error);
    }
  },

  deleteRegularJournalEntry: async (entry: RecurringTransaction): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('regular_journal_entries')
        .delete()
        .eq('id', entry.id)
        .eq('user_id', userId);
      if (error) throw error;
      set(() => ({
        regularJournalEntries: get().regularJournalEntries.filter((e) => e.id !== entry.id),
      }));
    } catch (error) {
      console.error("Failed to delete regular journal entry:", error);
    }
  },

  executeRegularJournalEntry: async (entry: RecurringTransaction): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data: dbEntry, error: fetchError } = await supabase
        .from('regular_journal_entries')
        .select('*')
        .eq('id', entry.id)
        .eq('user_id', userId)
        .single();
      if (fetchError) throw fetchError;

      const today = new Date().toISOString().split('T')[0];

      if (dbEntry.last_executed_date === today) {
        throw new Error('Entry already executed today');
      }

      const journalEntry = {
        id: `je_${crypto.randomUUID()}`,
        user_id: userId,
        date: today,
        description: dbEntry.description,
        debit_account_id: dbEntry.debit_account_id,
        credit_account_id: dbEntry.credit_account_id,
        amount: entry.amount || dbEntry.amount,
      };

      const { error: insertError } = await supabase
        .from('journal_entries')
        .insert(journalEntry);
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('regular_journal_entries')
        .update({ last_executed_date: today })
        .eq('id', entry.id)
        .eq('user_id', userId);
      if (updateError) throw updateError;

      await get().getJournalAccounts();
      await get().getRegularJournalEntries();
    } catch (error) {
      console.error("Failed to execute regular journal entry:", error);
    }
  },

  executeDueRegularJournalEntries: async (): Promise<{executed: number, details: any[]}> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return { executed: 0, details: [] };

    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const todayDayOfWeek = today.getDay(); // 0=日曜日, 1=月曜日, ...

      const { data: entries, error: fetchError } = await supabase
        .from('regular_journal_entries')
        .select('*')
        .eq('user_id', userId);
      if (fetchError) throw fetchError;

      const executedEntries: any[] = [];
      const details: any[] = [];

      for (const entry of entries) {
        if (entry.last_executed_date === todayStr) continue;
        if (entry.start_date && todayStr < entry.start_date) continue;
        if (entry.end_date && todayStr > entry.end_date) continue;

        let shouldExecute = false;

        switch (entry.frequency) {
          case 'daily':
            shouldExecute = true;
            break;

          case 'weekly': {
            const dayFlags = [
              entry.sun_flg_of_week,
              entry.mon_flg_of_week,
              entry.tue_flg_of_week,
              entry.wed_flg_of_week,
              entry.thu_flg_of_week,
              entry.fri_flg_of_week,
              entry.sat_flg_of_week,
            ];
            shouldExecute = Boolean(dayFlags[todayDayOfWeek]);
            if (shouldExecute && entry.public_holiday_ex_flg_of_week) {
              if (todayDayOfWeek === 0 || todayDayOfWeek === 6) {
                shouldExecute = false;
              }
            }
            break;
          }

          case 'monthly': {
            if (entry.date_of_month) {
              const currentMonthLastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
              const targetDay = Math.min(entry.date_of_month, currentMonthLastDay);
              const targetDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
              if (entry.holiday_div_of_month === 'before') {
                if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() - 2);
                else if (targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() - 1);
              } else if (entry.holiday_div_of_month === 'after') {
                if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1);
                else if (targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() + 2);
              }
              shouldExecute = targetDate.toISOString().split('T')[0] === todayStr;
            }
            break;
          }

          case 'yearly': {
            if (entry.date_of_year) {
              const [month, day] = entry.date_of_year.split('-').map(Number);
              const targetDate = new Date(today.getFullYear(), month - 1, day);
              if (entry.holiday_div_of_month === 'before') {
                if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() - 2);
                else if (targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() - 1);
              } else if (entry.holiday_div_of_month === 'after') {
                if (targetDate.getDay() === 0) targetDate.setDate(targetDate.getDate() + 1);
                else if (targetDate.getDay() === 6) targetDate.setDate(targetDate.getDate() + 2);
              }
              shouldExecute = targetDate.toISOString().split('T')[0] === todayStr;
            }
            break;
          }

          case 'free':
          default:
            shouldExecute = false;
            break;
        }

        if (shouldExecute) {
          try {
            const journalEntry = {
              id: `je_${crypto.randomUUID()}`,
              user_id: userId,
              date: todayStr,
              description: entry.description,
              debit_account_id: entry.debit_account_id,
              credit_account_id: entry.credit_account_id,
              amount: entry.amount,
            };

            const { data: newEntry, error: insertError } = await supabase
              .from('journal_entries')
              .insert(journalEntry)
              .select()
              .single();
            if (insertError) throw insertError;

            const { error: updateError } = await supabase
              .from('regular_journal_entries')
              .update({ last_executed_date: todayStr })
              .eq('id', entry.id)
              .eq('user_id', userId);
            if (updateError) throw updateError;

            executedEntries.push(newEntry);
            details.push({
              regularEntryId: entry.id,
              regularEntryName: entry.name,
              journalEntryId: newEntry.id,
              amount: newEntry.amount,
              frequency: entry.frequency,
            });
          } catch (err: any) {
            details.push({
              regularEntryId: entry.id,
              regularEntryName: entry.name,
              error: err?.message || 'Unknown error',
            });
          }
        }
      }

      await get().getJournalAccounts();
      await get().getRegularJournalEntries();

      return { executed: executedEntries.length, details };
    } catch (error) {
      console.error("Failed to execute due regular journal entries:", error);
      throw error;
    }
  },

  // --- VIEW Methods (Supabase RPC) ---
  getBalanceSheetView: async (asOfDate?: string): Promise<BalanceSheetView[]> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return [];

    try {
      const asOfDateStr = asOfDate || new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .rpc('fn_balance_sheet', { p_end_date: asOfDateStr, p_user_id: userId });
      if (error) throw error;
      return toCamelCase(data || []) as BalanceSheetView[];
    } catch (error) {
      console.error('Error fetching balance sheet view:', error);
      return [];
    }
  },

  getProfitLossStatementView: async (startDate?: string, endDate?: string): Promise<ProfitLossView[]> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return [];

    try {
      const today = new Date();
      const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const defaultEnd = today.toISOString().split('T')[0];
      const { data, error } = await supabase
        .rpc('fn_profit_loss', {
          p_start_date: startDate || defaultStart,
          p_end_date: endDate || defaultEnd,
          p_user_id: userId,
        });
      if (error) throw error;
      return toCamelCase(data || []) as ProfitLossView[];
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
