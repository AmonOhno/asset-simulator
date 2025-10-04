import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/accounts
router.get('/', authMiddleware, async (req, res) => {
    try {
    const user_id = req.user?.id;
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user_id);
    if (error) throw error;
    res.json(data);
    } catch (error: any) {
        console.error("Error fetching accounts:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/accounts
router.post('/', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user?.id;
        const newAccount = req.body;
        if (!newAccount.name || !newAccount.institution || !newAccount.branch_number || !newAccount.type || !newAccount.account_number || !newAccount.account_holder) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        newAccount.id = `acc_${crypto.randomUUID()}`;
        newAccount.user_id = user_id;
        try {
            const { error } = await supabase.rpc('create_account_with_journal', {
                account_data: newAccount,
                journal_account_data: {
                    id: newAccount.id,
                    name: newAccount.name,
                    category: 'Asset',
                    user_id: user_id
                }
            });
            if (error) throw error;
            res.status(201).json(newAccount);
        } catch (error: any) {
            console.error("Error creating account:", error);
            res.status(500).json({ error: error.message });
        }
    } catch (error: any) {
        console.error("Error in account creation process:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/accounts/:id
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const user_id = req.user?.id;
    const updatedAccountData = req.body;
    try {
        const { data, error } = await supabase
            .from('accounts')
            .update(updatedAccountData)
            .eq('id', id)
            .eq('user_id', user_id)
            .select();
        if (error) throw error;
        if (data && data.length > 0) {
            res.json(data[0]);
        } else {
            res.status(404).json({ error: 'Account not found' });
        }
    } catch (error: any) {
        console.error(`Error updating account ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
