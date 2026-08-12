// 貸借対照表・損益計算書の「取得のみ・state を持たない」純粋クエリ（Supabase RPC 経由）。
// financialStore のミューテーション/キャッシュとは分離し、呼び出し側が直接 import して使う。
import { toCamelCase } from '../utils/caseConvert';
import { formatDateLocal, todayLocalString } from '../utils/dateUtils';
import { BalanceSheetView, ProfitLossView } from '../types/common';
import { useAuthStore, supabase } from '../stores/authStore';

// 貸借対照表 VIEW（RPC `fn_balance_sheet`）
export async function fetchBalanceSheet(asOfDate?: string): Promise<BalanceSheetView[]> {
  const { userId } = useAuthStore.getState();
  if (!userId) return [];

  try {
    const asOfDateStr = asOfDate || todayLocalString();
    const { data, error } = await supabase
      .rpc('fn_balance_sheet', { p_end_date: asOfDateStr, p_user_id: userId });
    if (error) throw error;
    return toCamelCase(data || []) as BalanceSheetView[];
  } catch (error) {
    console.error('Error fetching balance sheet view:', error);
    return [];
  }
}

// 損益計算書 VIEW（RPC `fn_profit_loss`）
export async function fetchProfitLoss(startDate?: string, endDate?: string): Promise<ProfitLossView[]> {
  const { userId } = useAuthStore.getState();
  if (!userId) return [];

  try {
    const today = new Date();
    const defaultStart = formatDateLocal(new Date(today.getFullYear(), today.getMonth(), 1));
    const defaultEnd = todayLocalString();
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
}
