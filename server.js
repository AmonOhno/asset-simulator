const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// --- APIエンドポイント ---

// 勘定科目
app.get('/api/accounts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  const { name, institution, branchNumber, type, accountNumber, accountHolder } = req.body;
  if (!name || !institution || !branchNumber || !type || !accountNumber || !accountHolder) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newAccount = {
    id: `acc_${crypto.randomUUID()}`,
    name,
    institution,
    branchNumber,
    type,
    accountNumber,
    accountHolder
  };

  try {
    // トランザクションは Supabase の RPC 機能を使用して実装
    const { data, error } = await supabase.rpc('create_account_with_journal', {
      account_data: newAccount,
      journal_account_data: {
        id: newAccount.id,
        name: newAccount.name,
        category: 'Asset'
      }
    });

    if (error) throw error;
    res.status(201).json(newAccount);
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: error.message });
  }
});

// クレジットカード
app.get('/api/credit-cards', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching credit cards:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/credit-cards', async (req, res) => {
  const { name, closingDay, paymentDay, linkedAccountId } = req.body;
  if (!name || !closingDay || !paymentDay || !linkedAccountId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newCard = {
    id: `card_${crypto.randomUUID()}`,
    name,
    closingDay,
    paymentDay,
    linkedAccountId
  };

  try {
    const { data, error } = await supabase.rpc('create_credit_card_with_journal', {
      card_data: newCard,
      journal_account_data: {
        id: newCard.id,
        name: newCard.name,
        category: 'Liability'
      }
    });

    if (error) throw error;
    res.status(201).json(newCard);
  } catch (error) {
    console.error("Error creating credit card:", error);
    res.status(500).json({ error: error.message });
  }
});

// 仕訳帳科目
app.get('/api/journal-accounts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('journal_accounts')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching journal accounts:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/journal-accounts', async (req, res) => {
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
      .insert([newAccount]);

    if (error) throw error;
    res.status(201).json(newAccount);
  } catch (error) {
    console.error("Error creating journal account:", error);
    res.status(500).json({ error: error.message });
  }
});

// 仕訳
app.get('/api/journal-entries', async (req, res) => {
  try {
    console.log('Fetching journal entries...');
    const { data, error } = await supabase
      .from('journal_entries')
      .select(`*`);
    
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ error: error.message });
    }
  });

app.post('/api/journal-entries', async (req, res) => {
  const { date, description, debitAccountId, creditAccountId, amount } = req.body;
  if (!date || !description || !debitAccountId || !creditAccountId || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newEntry = {
    id: `entry_${crypto.randomUUID()}`,
    date,
    description,
    debitAccountId,  // ストアドプロシージャ内で変換されます
    creditAccountId, // ストアドプロシージャ内で変換されます
    amount: parseFloat(amount)
  };

  try {
    const { error } = await supabase.rpc('create_journal_entry', {
      entry_data: newEntry,
      update_balances: true
    });

    if (error) throw error;
    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- サーバー起動 ---
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});