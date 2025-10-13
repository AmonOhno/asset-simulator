import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/regular-journal-entries
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user?.id;
        console.log('Fetching regular journal entries...');
        const { data, error } = await supabase
            .from('regular_journal_entries')
            .select('*')
            .eq('user_id', user_id)
            .order('start_date', { ascending: false });
        
        if (error) {
            console.error("Supabase error:", error);
            throw error;
        }
        
        console.log('Regular journal entries fetched successfully:', data?.length || 0, 'entries');
        res.json(data);
    } catch (error: any) {
        console.error("Error fetching regular journal entries:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/regular-journal-entries
router.post('/', authMiddleware, async (req, res) => {
    try {
        const regularEntry = req.body;
        const user_id = req.user?.id;
        console.log('Creating regular journal entry:', regularEntry);
        if (!regularEntry.name || !regularEntry.debit_account_id || !regularEntry.credit_account_id || !regularEntry.frequency) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate new properties
        if (regularEntry.frequency === 'yearly' && !regularEntry.date_of_year) {
            return res.status(400).json({ error: "date_of_year is required for yearly frequency" });
        }
        if (regularEntry.frequency === 'monthly' && !regularEntry.date_of_month) {
            return res.status(400).json({ error: "date_of_month is required for monthly frequency" });
        }
        if (regularEntry.frequency === 'weekly' && !(
            regularEntry.mon_flg_of_week ||
            regularEntry.tue_flg_of_week ||
            regularEntry.wed_flg_of_week ||
            regularEntry.thu_flg_of_week ||
            regularEntry.fri_flg_of_week ||
            regularEntry.sat_flg_of_week ||
            regularEntry.sun_flg_of_week
        )) {
            return res.status(400).json({ error: "At least one day flag is required for weekly frequency" });
        }

        // id系を追加
        regularEntry.user_id = user_id;
        regularEntry.id = `reg_${crypto.randomUUID()}`;
        
        const { data, error } = await supabase
            .from('regular_journal_entries')
            .insert(regularEntry)
            .select()
            .single();

        if (error) throw error;
        
        res.status(201).json(data);
    } catch (error: any) {
        console.error("Error creating regular journal entry:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/regular-journal-entries/:id
router.put('/:id', authMiddleware,async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;
        const updatedEntry = req.body;
        
        const { data, error } = await supabase
            .from('regular_journal_entries')
            .update(updatedEntry)
            .eq('id', id)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({ error: "Regular journal entry not found" });
        }
        
        res.json(data);
    } catch (error: any) {
        console.error("Error updating regular journal entry:", error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/regular-journal-entries/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;
        const { data, error } = await supabase
            .from('regular_journal_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({ error: "Regular journal entry not found" });
        }
        
        res.json({ message: "Regular journal entry deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting regular journal entry:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
