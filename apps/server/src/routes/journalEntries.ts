import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { DEFAULT_USER_ID } from '../config/constants';

const router = Router();

// GET /api/journal-entries
router.get('/', async (req, res) => {
    try {
        console.log('Fetching journal entries...');
        console.log('Using user_id:', DEFAULT_USER_ID);
        const { data, error } = await supabase
            .from('journal_entries')
            .select(`*`)
            .eq('user_id', DEFAULT_USER_ID)
            .order('date', { ascending: false });
        if (error) {
            console.error("Supabase error:", error);
            throw error;
        }
        console.log('Journal entries fetched successfully:', data?.length || 0, 'entries');
        res.json(data);
    } catch (error: any) {
        console.error("Error fetching journal entries:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        res.status(500).json({ error: error.message });
    }
});

// POST /api/journal-entries
router.post('/', async (req, res) => {
    const newEntry = req.body;
    if (!newEntry.date || !newEntry.description || !newEntry.debit_account_id || !newEntry.credit_account_id || !newEntry.amount) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    newEntry.id = `entry_${crypto.randomUUID()}`;
    newEntry.amount = parseFloat(newEntry.amount);
    newEntry.user_id = DEFAULT_USER_ID; // ユーザーIDを追加

    const rpcEntryData = {
        id: newEntry.id,
        date: newEntry.date,
        description: newEntry.description,
        debitAccountId: newEntry.debit_account_id,
        creditAccountId: newEntry.credit_account_id,
        amount: newEntry.amount,
        user_id: DEFAULT_USER_ID // ユーザーIDを追加
    };

    try {
        const { error } = await supabase.rpc('create_journal_entry', {
            entry_data: rpcEntryData,
            update_balances: true
        });
        if (error) throw error;
        res.status(201).json(newEntry);
    } catch (error: any) {
        console.error("Error creating journal entry:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/journal-entries/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const entry = req.body;
    if (!entry.date || !entry.description || !entry.debit_account_id || !entry.credit_account_id || !entry.amount) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const { data, error } = await supabase
            .from('journal_entries')
            .update({
                date: entry.date,
                description: entry.description,
                debit_account_id: entry.debit_account_id,
                credit_account_id: entry.credit_account_id,
                amount: parseFloat(entry.amount)
            })
            .eq('id', id)
            .eq('user_id', DEFAULT_USER_ID)
            .select();
        if (error) throw error;
        if (data && data.length > 0) {
            res.json(data[0]);
        } else {
            res.status(404).json({ error: 'Journal entry not found' });
        }
    } catch (error: any) {
        console.error(`Error updating journal entry ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
