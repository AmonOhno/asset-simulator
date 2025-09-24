import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { DEFAULT_USER_ID } from '../config/constants';

const router = Router();

// GET /api/regular-journal-entries
router.get('/', async (req, res) => {
    try {
        console.log('Fetching regular journal entries...');
        const { data, error } = await supabase
            .from('regular_journal_entries')
            .select('*')
            .eq('user_id', DEFAULT_USER_ID)
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
router.post('/', async (req, res) => {
    try {
        const regularEntry = req.body;
        
        if (!regularEntry.name || !regularEntry.debit_account_id || !regularEntry.credit_account_id || !regularEntry.frequency) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // id系を追加
        regularEntry.user_id = DEFAULT_USER_ID;
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
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedEntry = req.body;
        
        const { data, error } = await supabase
            .from('regular_journal_entries')
            .update(updatedEntry)
            .eq('id', id)
            .eq('user_id', DEFAULT_USER_ID)
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
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('regular_journal_entries')
            .delete()
            .eq('id', id)
            .eq('user_id', DEFAULT_USER_ID)
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

// POST /api/regular-journal-entries/:id/execute
router.post('/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body; // 金額が0円の場合に入力された金額
        
        // 定期取引を取得
        const { data: regularEntry, error: fetchError } = await supabase
            .from('regular_journal_entries')
            .select('*')
            .eq('id', id)
            .eq('user_id', DEFAULT_USER_ID)
            .single();

        if (fetchError) throw fetchError;
        if (!regularEntry) {
            return res.status(404).json({ error: "Regular journal entry not found" });
        }

        const today = new Date().toISOString().split('T')[0];
        
        // 仕訳エントリを作成
        const journalEntry = {
            id: `entry_${crypto.randomUUID()}`,
            date: today,
            description: regularEntry.description || regularEntry.name,
            debit_account_id: regularEntry.debit_account_id,
            credit_account_id: regularEntry.credit_account_id,
            amount: amount || regularEntry.amount || 0,
            user_id: DEFAULT_USER_ID
        };

        const { error: journalError } = await supabase
            .from('journal_entries')
            .insert(journalEntry);

        if (journalError) throw journalError;

        // 最後の実行日を更新
        const { error: updateError } = await supabase
            .from('regular_journal_entries')
            .update({ last_exec_date: today })
            .eq('id', id)
            .eq('user_id', DEFAULT_USER_ID);

        if (updateError) throw updateError;

        res.json({ message: "Regular journal entry executed successfully", journalEntry });
    } catch (error: any) {
        console.error("Error executing regular journal entry:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/regular-journal-entries/execute-due
// 実行期日が来た定期取引を自動実行
router.post('/execute-due', async (req, res) => {
    try {
        console.log('定期取引の自動実行を開始...');
        const today = new Date().toISOString().split('T')[0];
        
        // アクティブな定期取引を取得
        const { data: regularEntries, error: fetchError } = await supabase
            .from('regular_journal_entries')
            .select('*')
            .eq('user_id', DEFAULT_USER_ID)
            .eq('active_flg', true);
            
        if (fetchError) throw fetchError;
        
        const executed = [];
        
        for (const entry of regularEntries || []) {
            // 次回実行日を計算
            let shouldExecute = false;
            const startDate = new Date(entry.start_date);
            const todayDate = new Date(today);
            
            if (startDate <= todayDate) {
                switch (entry.frequency) {
                    case 'daily':
                        shouldExecute = true;
                        break;
                    case 'weekly':
                        const dayOfWeek = entry.day_of_week || 0;
                        shouldExecute = todayDate.getDay() === dayOfWeek;
                        break;
                    case 'monthly':
                        const dayOfMonth = entry.day_of_month || 1;
                        shouldExecute = todayDate.getDate() === dayOfMonth;
                        break;
                }
            }
            
            if (shouldExecute) {
                // 今日既に実行されているかチェック
                const { data: existingEntries } = await supabase
                    .from('journal_entries')
                    .select('id')
                    .eq('user_id', DEFAULT_USER_ID)
                    .eq('regular_journal_entry_id', entry.id)
                    .eq('date', today);
                    
                if (!existingEntries || existingEntries.length === 0) {
                    // 仕訳を実行
                    const entryId = crypto.randomUUID();
                    const { data: journalEntry, error: insertError } = await supabase
                        .from('journal_entries')
                        .insert({
                            id: entryId,
                            date: today,
                            description: `[定期] ${entry.description}`,
                            debit_account_id: entry.debit_account_id,
                            credit_account_id: entry.credit_account_id,
                            amount: entry.amount,
                            regular_journal_entry_id: entry.id,
                            user_id: DEFAULT_USER_ID,
                            created_at: new Date().toISOString()
                        })
                        .select()
                        .single();
                        
                    if (insertError) {
                        console.error(`定期取引 ${entry.id} の実行に失敗:`, insertError);
                    } else {
                        executed.push({ regularEntry: entry, journalEntry });
                        console.log(`定期取引 ${entry.id} を実行しました`);
                    }
                }
            }
        }
        
        res.json({ 
            message: `${executed.length}件の定期取引を実行しました`,
            executed: executed.length,
            details: executed.map(e => ({
                name: e.regularEntry.name,
                amount: e.regularEntry.amount,
                journalEntryId: e.journalEntry.id
            }))
        });
        
    } catch (error: any) {
        console.error("Error executing due regular journal entries:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
