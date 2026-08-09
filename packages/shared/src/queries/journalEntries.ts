// 仕訳エントリー関連の「取得のみ・state を持たない」純粋クエリ。
// financialStore のミューテーション/キャッシュとは分離し、呼び出し側が直接 import して使う。
import { toCamelCase } from '../utils/caseConvert';
import { aggregateFrequentEntrySets } from '../utils/frequentEntries';
import type { FrequentEntrySet } from '../utils/frequentEntries';
import { CalendarJournalEntry } from '../types/common';
import { useAuthStore, supabase } from '../stores/authStore';

// 「よく使う取引入力値セット」の集計対象とする直近仕訳の件数
export const FREQUENT_ENTRY_LOOKBACK_COUNT = 200;

// カレンダー表示用VIEW `v_journal_entries_for_calendar` から仕訳を取得
// 勘定科目名とカテゴリが事前に JOIN されているため、クライアント側の find() 検索が不要
export async function fetchCalendarJournalEntries(startDate: string, endDate: string): Promise<CalendarJournalEntry[]> {
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
}

// 直近の仕訳から「よく使う取引入力値セット」を集計して返す（取引入力画面のサジェスト用。state には保存しない）
export async function fetchFrequentEntrySets(limit = 5): Promise<FrequentEntrySet[]> {
  const { userId } = useAuthStore.getState();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('date, description, debit_account_id, credit_account_id, amount')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(FREQUENT_ENTRY_LOOKBACK_COUNT);
    if (error) throw error;
    return aggregateFrequentEntrySets(toCamelCase(data || []), limit);
  } catch (error) {
    console.error('Failed to fetch frequent journal entry sets:', error);
    return [];
  }
}
