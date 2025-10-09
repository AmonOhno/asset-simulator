import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/schedule-events
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { data, error } = await supabase
            .from('schedule_events')   
            .select('*')
            .eq('user_id', user_id);
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error("Error fetching schedule events:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/schedule-events
router.post('/', authMiddleware, async (req, res) => {
    const { title, start_date, start_time, end_date, end_time, all_day_flg, description } = req.body;
    const user_id = req.user?.id;
    // DB挿入
    const newEvent = {
        event_id: `event_${crypto.randomUUID()}`,
        user_id: user_id,
        title: title,
        all_day_flg: all_day_flg,
        start_date: start_date,
        start_time: start_time || null,
        end_date: end_date,
        end_time: end_time || null,
        description: description || '',
        created_at: new Date().toISOString()
    };
    try {
        const { data, error } = await supabase
            .from('schedule_events')
            .insert([newEvent])
            .select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error: any) {
        console.error("Error creating schedule event:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/schedule-events/:id
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user?.id;
    const { title, start_date, start_time, end_date, end_time, all_day_flg, description } = req.body;
    // バリデーション
    if (!title || !start_date || !end_date) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    if (new Date(start_date) > new Date(end_date)) {
        return res.status(400).json({ error: "Start date must be before end date" });
    }
    if (title.length > 100) {
        return res.status(400).json({ error: "Title must be 100 characters or less" });
    }
    if (!all_day_flg && (!start_time || !end_time)) {
        return res.status(400).json({ error: "Timed events must have start and end times" });
    }
    if (all_day_flg && (start_time || end_time)) {
        return res.status(400).json({ error: "Timed events must not have all-day flag set" });
    }
    // DB更新
    try {
        const { data, error } = await supabase
            .from('schedule_events')
            .update({
                title: title,
                all_day_flg: all_day_flg,
                start_date: start_date,
                start_time: start_time || null,
                end_date: end_date,
                end_time: end_time || null,
                description: description || ''
            })
            .eq('event_id', id)
            .eq('user_id', user_id)
            .select();
        if (error) throw error;
        if (data && data.length > 0) {
            res.json(data[0]);
        } else {
            res.status(404).json({ error: "Event not found" });
        }
    } catch (error: any) {
        console.error("Error updating schedule event:", error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/schedule-events/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user?.id;
    console.log('削除リクエスト受信:', id);
    try {
        const { data, error } = await supabase
            .from('schedule_events')
            .delete()
            .eq('event_id', id) // event_idカラムで検索
            .eq('user_id', user_id)
            .select();
        if (error) {
            console.error('削除エラー:', error);
            throw error;
        }
        console.log('削除結果:', data);
        if (data && data.length > 0) {
            res.json({ message: "Event deleted", deletedEvent: data[0] });
        } else {
            console.log('イベントが見つかりません:', id);
            res.status(404).json({ error: "Event not found" });
        }
    } catch (error: any) {
        console.error("Error deleting schedule event:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;