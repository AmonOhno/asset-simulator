import { Router } from 'express';
import crypto from 'crypto';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/credit-cards
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase.from('credit_cards').select('*');
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error("Error fetching credit cards:", error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/credit-cards
router.post('/', async (req, res) => {
    const newCard = req.body;
    if (!newCard.name || !newCard.closing_day || !newCard.payment_day || !newCard.linked_account_id) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    newCard.id = `card_${crypto.randomUUID()}`;
    try {
        const { error } = await supabase.rpc('create_credit_card_with_journal', {
            card_data: newCard,
            journal_account_data: {
                id: newCard.id,
                name: newCard.name,
                category: 'Liability'
            }
        });
        if (error) throw error;
        res.status(201).json(newCard);
    } catch (error: any) {
        console.error("Error creating credit card:", error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/credit-cards/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updatedCardData = req.body;
    try {
        const { data, error } = await supabase
            .from('credit_cards')
            .update(updatedCardData)
            .eq('id', id)
            .select();
        if (error) throw error;
        if (data && data.length > 0) {
            res.json(data[0]);
        } else {
            res.status(404).json({ error: 'Credit card not found' });
        }
    } catch (error: any) {
        console.error(`Error updating credit card ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
