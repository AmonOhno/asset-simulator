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

// EXECUTE /api/regular-journal-entries/execute/:id
router.post('/execute/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user?.id;
        const { amount, force, executionDate } = req.body;
        
        console.log('Executing regular journal entry:', id, 'for user:', user_id);
        
        // 定期取引を取得
        const { data: entry, error: fetchError } = await supabase
            .from('regular_journal_entries')
            .select('*')
            .eq('id', id)
            .eq('user_id', user_id)
            .single();

        if (fetchError) throw fetchError;
        if (!entry) {
            return res.status(404).json({ error: "Regular journal entry not found" });
        }

        const today = executionDate || new Date().toISOString().split('T')[0];
        
        // 当日すでに実行済みかチェック
        if (entry.last_executed_date === today && !force) {
            return res.status(400).json({ error: "Entry already executed today" });
        }

        // 仕訳エントリを作成
        const journalEntry = {
            id: `je_${crypto.randomUUID()}`,
            user_id,
            date: today,
            description: entry.description,
            debit_account_id: entry.debit_account_id,
            credit_account_id: entry.credit_account_id,
            amount: amount || entry.amount
        };

        const { data: newEntry, error: insertError } = await supabase
            .from('journal_entries')
            .insert(journalEntry)
            .select()
            .single();

        if (insertError) throw insertError;

        // 最終実行日を更新
        const { error: updateError } = await supabase
            .from('regular_journal_entries')
            .update({ last_executed_date: today })
            .eq('id', id)
            .eq('user_id', user_id);

        if (updateError) throw updateError;

        res.json({ 
            message: "Regular journal entry executed successfully", 
            journalEntry: newEntry 
        });
    } catch (error: any) {
        console.error("Error executing regular journal entry:", error);
        res.status(500).json({ error: error.message });
    }
});

// EXECUTE DUE /api/regular-journal-entries/execute-due
router.post('/execute-due', authMiddleware, async (req, res) => {
    try {
        const user_id = req.user?.id;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayDayOfWeek = today.getDay(); // 0=日曜日, 1=月曜日, ...
        
        console.log('Executing due regular journal entries for user:', user_id, 'on', todayStr);
        
        // 全ての定期取引を取得
        const { data: entries, error: fetchError } = await supabase
            .from('regular_journal_entries')
            .select('*')
            .eq('user_id', user_id);

        if (fetchError) throw fetchError;

        const executedEntries = [];
        const details = [];

        for (const entry of entries) {
            console.log(`Processing entry ${entry.id} (${entry.name}): frequency=${entry.frequency}, lastExecuted=${entry.last_executed_date}`);
            
            // 当日すでに実行済みかチェック
            if (entry.last_executed_date === todayStr) {
                console.log(`Entry ${entry.id} already executed today, skipping`);
                continue;
            }

            // 開始日・終了日チェック
            if (entry.start_date && todayStr < entry.start_date) {
                continue;
            }
            if (entry.end_date && todayStr > entry.end_date) {
                continue;
            }

            let shouldExecute = false;

            // 頻度に応じて実行判定
            switch (entry.frequency) {
                case 'daily':
                    shouldExecute = true;
                    break;
                
                case 'weekly':
                    const dayFlags = [
                        entry.sun_flg_of_week,  // 0: 日曜日
                        entry.mon_flg_of_week,  // 1: 月曜日
                        entry.tue_flg_of_week,  // 2: 火曜日
                        entry.wed_flg_of_week,  // 3: 水曜日
                        entry.thu_flg_of_week,  // 4: 木曜日
                        entry.fri_flg_of_week,  // 5: 金曜日
                        entry.sat_flg_of_week   // 6: 土曜日
                    ];
                    shouldExecute = Boolean(dayFlags[todayDayOfWeek]);
                    
                    // 祝日・日曜日除外設定のチェック
                    if (shouldExecute && entry.public_holiday_ex_flg_of_week) {
                        // 日曜日または土曜日の場合は除外
                        if (todayDayOfWeek === 0 || todayDayOfWeek === 6) {
                            shouldExecute = false;
                            console.log(`Weekly entry ${entry.id}: Excluded due to weekend (public_holiday_ex_flg_of_week=true)`);
                        }
                    }
                    
                    console.log(`Weekly check for entry ${entry.id}: dayOfWeek=${todayDayOfWeek}, dayFlags=${JSON.stringify(dayFlags)}, shouldExecute=${shouldExecute}, lastExecuted=${entry.last_executed_date}`);
                    break;
                
                case 'monthly':
                    if (entry.date_of_month) {
                        const currentMonthLastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
                        const targetDay = Math.min(entry.date_of_month, currentMonthLastDay);
                        let targetDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
                        
                        console.log(`Monthly check for entry ${entry.id}: targetDay=${targetDay}, targetDate=${targetDate.toISOString().split('T')[0]}, today=${todayStr}`);
                        
                        // 休日調整
                        if (entry.holiday_div_of_month === 'before') {
                            // 土日なら前営業日に調整
                            if (targetDate.getDay() === 0) { // 日曜日
                                targetDate.setDate(targetDate.getDate() - 2);
                                console.log(`Holiday adjustment (before): Sunday -> ${targetDate.toISOString().split('T')[0]}`);
                            } else if (targetDate.getDay() === 6) { // 土曜日
                                targetDate.setDate(targetDate.getDate() - 1);
                                console.log(`Holiday adjustment (before): Saturday -> ${targetDate.toISOString().split('T')[0]}`);
                            }
                        } else if (entry.holiday_div_of_month === 'after') {
                            // 土日なら翌営業日に調整
                            if (targetDate.getDay() === 0) { // 日曜日
                                targetDate.setDate(targetDate.getDate() + 1);
                                console.log(`Holiday adjustment (after): Sunday -> ${targetDate.toISOString().split('T')[0]}`);
                            } else if (targetDate.getDay() === 6) { // 土曜日
                                targetDate.setDate(targetDate.getDate() + 2);
                                console.log(`Holiday adjustment (after): Saturday -> ${targetDate.toISOString().split('T')[0]}`);
                            }
                        }
                        
                        shouldExecute = targetDate.toISOString().split('T')[0] === todayStr;
                        console.log(`Monthly execution decision for entry ${entry.id}: shouldExecute=${shouldExecute}`);
                    }
                    break;
                
                case 'yearly':
                    if (entry.date_of_year) {
                        const [month, day] = entry.date_of_year.split('-').map(Number);
                        let targetDate = new Date(today.getFullYear(), month - 1, day);
                        
                        console.log(`Yearly check for entry ${entry.id}: originalDate=${targetDate.toISOString().split('T')[0]}, today=${todayStr}`);
                        
                        // 休日調整
                        if (entry.holiday_div_of_month === 'before') {
                            if (targetDate.getDay() === 0) { // 日曜日
                                targetDate.setDate(targetDate.getDate() - 2);
                                console.log(`Holiday adjustment (before): Sunday -> ${targetDate.toISOString().split('T')[0]}`);
                            } else if (targetDate.getDay() === 6) { // 土曜日
                                targetDate.setDate(targetDate.getDate() - 1);
                                console.log(`Holiday adjustment (before): Saturday -> ${targetDate.toISOString().split('T')[0]}`);
                            }
                        } else if (entry.holiday_div_of_month === 'after') {
                            if (targetDate.getDay() === 0) { // 日曜日
                                targetDate.setDate(targetDate.getDate() + 1);
                                console.log(`Holiday adjustment (after): Sunday -> ${targetDate.toISOString().split('T')[0]}`);
                            } else if (targetDate.getDay() === 6) { // 土曜日
                                targetDate.setDate(targetDate.getDate() + 2);
                                console.log(`Holiday adjustment (after): Saturday -> ${targetDate.toISOString().split('T')[0]}`);
                            }
                        }
                        
                        shouldExecute = targetDate.toISOString().split('T')[0] === todayStr;
                        console.log(`Yearly execution decision for entry ${entry.id}: shouldExecute=${shouldExecute}`);
                    }
                    break;
                
                case 'free':
                default:
                    // 適宜実行は自動実行しない
                    shouldExecute = false;
                    break;
            }

            if (shouldExecute) {
                console.log(`Executing entry ${entry.id} (${entry.name})`);
                try {
                    // 仕訳エントリを作成
                    const journalEntry = {
                        id: `je_${crypto.randomUUID()}`,
                        user_id,
                        date: todayStr,
                        description: entry.description,
                        debit_account_id: entry.debit_account_id,
                        credit_account_id: entry.credit_account_id,
                        amount: entry.amount
                    };

                    const { data: newEntry, error: insertError } = await supabase
                        .from('journal_entries')
                        .insert(journalEntry)
                        .select()
                        .single();

                    if (insertError) throw insertError;

                    // 最終実行日を更新
                    const { error: updateError } = await supabase
                        .from('regular_journal_entries')
                        .update({ last_executed_date: todayStr })
                        .eq('id', entry.id)
                        .eq('user_id', user_id);

                    if (updateError) throw updateError;

                    executedEntries.push(newEntry);
                    details.push({
                        regularEntryId: entry.id,
                        regularEntryName: entry.name,
                        journalEntryId: newEntry.id,
                        amount: newEntry.amount,
                        frequency: entry.frequency
                    });

                } catch (error: any) {
                    console.error(`Error executing entry ${entry.id}:`, error);
                    details.push({
                        regularEntryId: entry.id,
                        regularEntryName: entry.name,
                        error: error?.message || 'Unknown error'
                    });
                }
            }
        }

        res.json({ 
            executed: executedEntries.length,
            details: details,
            message: `${executedEntries.length} regular journal entries executed successfully`
        });
    } catch (error: any) {
        console.error("Error executing due regular journal entries:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
