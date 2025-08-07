import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/journal-accounts
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('journal_accounts').select('*');
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error("Error fetching journal accounts:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/journal-accounts
router.post('/', async (req, res) => {
    const { name, category } = req.body;
    if (!name || !category) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const newAccount = {
        id: `jacc_${crypto.randomUUID()}`,
        name,
        category
    };
    try {
        const { data, error } = await supabase
            .from('journal_accounts')
            .insert([newAccount])
            .select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error: any) {
        console.error("Error creating journal account:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/journal-accounts/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedJournalAccountData = req.body;
    try {
        const { data, error } = await supabase
            .from('journal_accounts')
            .update(updatedJournalAccountData)
            .eq('id', id)
            .select();
        if (error) throw error;
        if (data && data.length > 0) {
            res.json(data[0]);
        } else {
            res.status(404).json({ error: 'Journal account not found' });
        }
    } catch (error: any) {
        console.error(`Error updating journal account ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
