import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';
import { toCamelCase, toSnakeCase } from '../utils/caseConvert';
import { todayLocalString } from '../utils/dateUtils';
import { isExecutionDate } from '../utils/recurrence';
import { migrateLegacyGoal } from '../utils/goals';
import {
  JournalAccount,
  JournalEntry,
  RecurringTransaction,
  Goal,
} from '../types/common';
import { useAuthStore, supabase } from './authStore';


// --- ストアの型定義 ---
interface FinancialState {
  // Master Data
  journalAccounts: JournalAccount[]; // 勘定科目リスト
  regularJournalEntries: RecurringTransaction[];
  goals: Goal[]; // 支出目標リスト

  // GET Actions
  fetchJournalAccounts: () => Promise<JournalAccount[]>;
  fetchRegularJournalEntries: () => Promise<RecurringTransaction[]>;
  fetchGoals: () => Promise<Goal[]>;

  // CRUD Actions
  addJournalAccount: (account: Omit<JournalAccount, 'id'>) => Promise<void>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
  addRegularJournalEntry: (entry: Omit<RecurringTransaction, 'id'>) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateJournalAccount: (account: JournalAccount) => Promise<void>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;
  updateRegularJournalEntry: (entry: RecurringTransaction) => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteJournalAccount: (account: JournalAccount) => Promise<void>;
  deleteJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteRegularJournalEntry: (entry: RecurringTransaction) => Promise<void>;
  deleteGoal: (goal: Goal) => Promise<void>;
  executeRegularJournalEntry: (entry: RecurringTransaction) => Promise<void>; // 個別実行
  executeDueRegularJournalEntries: () => Promise<{executed: number, details: any[]}>; // 期限が来ている定期取引を実行
}

// goals + goal_accounts のネスト取得結果（camelCase 変換後）を Goal に整形する
function toGoal(row: any): Goal {
  const { goalAccounts, ...goal } = row;
  return {
    ...goal,
    name: goal.name ?? '',
    accountIds: (goalAccounts || []).map((a: { accountId: string }) => a.accountId),
  };
}

// 目標本体（goals）と対象勘定科目（goal_accounts）を save_goal RPC で一括保存する。
// addGoal / updateGoal の両方から利用する。
async function saveGoalViaRpc(userId: string, goal: Goal): Promise<Goal> {
  const accountIds = Array.from(new Set(goal.accountIds));
  if (accountIds.length === 0) throw new Error('対象勘定科目が指定されていません');

  const { error } = await supabase.rpc('save_goal', {
    p_user_id: userId,
    p_goal_id: goal.id,
    p_name: goal.name ?? '',
    p_period: goal.period,
    p_amount: goal.amount,
    p_account_ids: accountIds,
  });
  if (error) throw error;

  return { ...goal, name: goal.name ?? '', accountIds, userId };
}

// 定期取引の実行（仕訳挿入 + last_executed_date 更新）を行う共通処理。
// executeRegularJournalEntry / executeDueRegularJournalEntries の両方から利用する。
async function insertRecurringExecution(
  userId: string,
  dbEntry: any,
  todayStr: string,
  amountOverride?: number
): Promise<any> {
  const journalEntry = {
    id: `je_${crypto.randomUUID()}`,
    user_id: userId,
    date: todayStr,
    description: dbEntry.description,
    debit_account_id: dbEntry.debit_account_id,
    credit_account_id: dbEntry.credit_account_id,
    amount: amountOverride || dbEntry.amount,
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
    .eq('id', dbEntry.id)
    .eq('user_id', userId);
  if (updateError) throw updateError;

  return newEntry;
}

const financialStore: StateCreator<FinancialState> = (set, get) => {
  // Keep in-sync with auth user changes: clear or hydrate state
  useAuthStore.subscribe((s) => {
    const uid = s.userId;
    if (!uid) {
      set({
        journalAccounts: [],
        regularJournalEntries: [],
        goals: [],
      });
      return;
    }
  });

  return ({
  // --- STATE ---
  journalAccounts: [],
  regularJournalEntries: [],
  goals: [],

  // --- CRUD Actions ---
  fetchJournalAccounts: async (): Promise<JournalAccount[]> => {
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

  fetchRegularJournalEntries: async (): Promise<RecurringTransaction[]> => {
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

  fetchGoals: async (): Promise<Goal[]> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*, goal_accounts(account_id)')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const goals = toCamelCase(data || []).map(toGoal);
      set(() => ({ goals }));
      return goals;
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      return get().goals;
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
        include_in_summary: account.includeInSummary,
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
      const entryId = `je_${crypto.randomUUID()}`;
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

  addGoal: async (goal: Omit<Goal, 'id'>): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      // goals と goal_accounts の書き込みが分離しないよう RPC で一括保存する
      const added = await saveGoalViaRpc(userId, { ...goal, id: `goal_${crypto.randomUUID()}` });
      set(() => ({ goals: [...get().goals, added] }));
    } catch (error) {
      console.error("Failed to add goal:", error);
      throw error;
    }
  },

  updateJournalAccount: async (account: JournalAccount): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('journal_accounts')
        .update({
          name: account.name,
          category: account.category,
          include_in_summary: account.includeInSummary,
        })
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
      const { error } = await supabase
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

  updateGoal: async (goal: Goal): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const updated = await saveGoalViaRpc(userId, goal);
      set(() => ({
        goals: get().goals.map((g) => g.id === updated.id ? updated : g),
      }));
    } catch (error) {
      console.error("Failed to update goal:", error);
      throw error;
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

  deleteGoal: async (goal: Goal): Promise<void> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id)
        .eq('user_id', userId);
      if (error) throw error;
      set(() => ({
        goals: get().goals.filter((g) => g.id !== goal.id),
      }));
    } catch (error) {
      console.error("Failed to delete goal:", error);
      throw error;
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

      const today = todayLocalString();

      if (dbEntry.last_executed_date === today) {
        throw new Error('Entry already executed today');
      }

      await insertRecurringExecution(userId, dbEntry, today, entry.amount);

      await get().fetchJournalAccounts();
      await get().fetchRegularJournalEntries();
    } catch (error) {
      console.error("Failed to execute regular journal entry:", error);
    }
  },

  executeDueRegularJournalEntries: async (): Promise<{executed: number, details: any[]}> => {
    const { userId } = useAuthStore.getState();
    if (!userId) return { executed: 0, details: [] };

    try {
      const today = new Date();
      const todayStr = todayLocalString();

      const { data: entries, error: fetchError } = await supabase
        .from('regular_journal_entries')
        .select('*')
        .eq('user_id', userId);
      if (fetchError) throw fetchError;

      const executedEntries: any[] = [];
      const details: any[] = [];

      for (const entry of entries) {
        if (entry.last_executed_date === todayStr) continue;

        const transaction = toCamelCase(entry) as RecurringTransaction;
        if (!isExecutionDate(transaction, today)) continue;

        try {
          const newEntry = await insertRecurringExecution(userId, entry, todayStr);

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

      await get().fetchJournalAccounts();
      await get().fetchRegularJournalEntries();

      return { executed: executedEntries.length, details };
    } catch (error) {
      console.error("Failed to execute due regular journal entries:", error);
      throw error;
    }
  },

});

};

export const useFinancialStore = create<FinancialState>()(
  persist(
    financialStore,
    {
      name: 'financial-store', // localStorage key
      // #147 で Goal が accountId（単数）から accountIds（複数）に変わったため、
      // 旧形式のまま復元して描画時に例外を起こさないようマイグレーションする
      version: 1,
      migrate: (persisted: any, version: number) => {
        if (version >= 1) return persisted;
        return {
          ...persisted,
          goals: (persisted?.goals ?? []).map(migrateLegacyGoal),
        };
      },
      // 永続化対象を明示的に絞る（journalEntries 等の未使用 state を localStorage に残さない）
      partialize: (state) => ({
        journalAccounts: state.journalAccounts,
        regularJournalEntries: state.regularJournalEntries,
        goals: state.goals,
      }),
    }
  )
);
