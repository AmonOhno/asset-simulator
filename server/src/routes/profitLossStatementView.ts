import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';
import { toCamelCase } from '@asset-simulator/shared';

const router = Router();

// GET /api/profit-loss-statement-view?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user?.id;
    console.log('Fetching profit/loss statement for user:', user_id);

    // クエリパラメータから日付を取得
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultStartDate = monthStart.toISOString().split('T')[0];
    const defaultEndDate = today.toISOString().split('T')[0];
    
    const startDate = (req.query.startDate as string) || defaultStartDate;
    const endDate = (req.query.endDate as string) || defaultEndDate;
    
    console.log('Using startDate:', startDate, 'endDate:', endDate);

    // fn_profit_loss(p_start_date, p_end_date) 関数を呼び出し
    const { data, error } = await supabase
      .rpc('fn_profit_loss', { p_start_date: startDate, p_end_date: endDate });

    if (error) {
      console.error('Error calling fn_profit_loss:', error);
      throw error;
    }

    // ユーザーIDでフィルタリング（関数の結果から）
    const filtered = (data || []).filter((row: any) => row.user_id === user_id);
    const camelCased = toCamelCase(filtered);

    console.log('Profit/loss statement fetched successfully:', camelCased.length, 'rows');
    res.json(camelCased);
  } catch (error: any) {
    console.error('Error in profit/loss statement route:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
