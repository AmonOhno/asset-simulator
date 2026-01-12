import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';
import { toCamelCase } from '@asset-simulator/shared';

const router = Router();

// GET /api/balance-sheet-view?asOfDate=YYYY-MM-DD
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user?.id;
    console.log('Fetching balance sheet for user:', user_id);

    // クエリパラメータから日付を取得（デフォルトは今日）
    const asOfDate = (req.query.asOfDate as string) || new Date().toISOString().split('T')[0];
    console.log('Using asOfDate:', asOfDate);

    // fn_balance_sheet(p_end_date) 関数を呼び出し
    const { data, error } = await supabase
      .rpc('fn_balance_sheet', { p_end_date: asOfDate });

    if (error) {
      console.error('Error calling fn_balance_sheet:', error);
      throw error;
    }

    // ユーザーIDでフィルタリング（関数の結果から）
    const filtered = (data || []).filter((row: any) => row.user_id === user_id);
    const camelCased = toCamelCase(filtered);

    console.log('Balance sheet fetched successfully:', camelCased.length, 'rows');
    res.json(camelCased);
  } catch (error: any) {
    console.error('Error in balance sheet route:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
