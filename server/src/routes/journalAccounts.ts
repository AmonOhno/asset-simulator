import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/journal-accounts
router.get('/', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user?.id;
        const { data, error } = await supabase
            .from('journal_accounts')
            .select('*')
            .eq('user_id', user_id);
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error("Error fetching journal accounts:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/journal-accounts
router.post('/', authMiddleware, async (req, res) => {
    const { name, category } = req.body;
    const user_id = req.user?.id;
    if (!name || !category) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    const newAccount = {
        id: `jacc_${crypto.randomUUID()}`,
        name,
        category,
        user_id: user_id
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
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user?.id;
    const { name, category } = req.body;
    if (!name || !category) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const { data, error } = await supabase
            .from('journal_accounts')
            .update({
                name: name,
                category: category
            })
            .eq('id', id)
            .eq('user_id', user_id)
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
