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
  const newAccount = req.body; // req.bodyを直接使用
  if (!newAccount.name || !newAccount.institution || !newAccount.branch_number || !newAccount.type || !newAccount.account_number || !newAccount.account_holder) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  newAccount.id = `acc_${crypto.randomUUID()}`;

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
  const newCard = req.body; // req.bodyを直接使用
  if (!newCard.name || !newCard.closing_day || !newCard.payment_day || !newCard.linked_account_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  newCard.id = `card_${crypto.randomUUID()}`;

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

app.get('/api/journal-entries', async (req, res) => {
  try {
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

app.put('/api/accounts/:id', async (req, res) => {
    const { id } = req.params;
    const updatedAccountData = req.body; // req.bodyを直接使用

    try {
        const { data, error } = await supabase
            .from('accounts')
            .update(updatedAccountData)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error(`Error updating account ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/credit-cards/:id', async (req, res) => {
    const { id } = req.params;
    const updatedCardData = req.body; // req.bodyを直接使用

    try {
        const { data, error } = await supabase
            .from('credit_cards')
            .update(updatedCardData)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error(`Error updating credit card ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/journal-accounts/:id', async (req, res) => {
    const { id } = req.params;
    const updatedJournalAccountData = req.body; // req.bodyを直接使用

    try {
        const { data, error } = await supabase
            .from('journal_accounts')
            .update(updatedJournalAccountData)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error(`Error updating journal account ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/journal-entries/:id', async (req, res) => {
    const { id } = req.params;
    const updatedJournalEntryData = req.body; // req.bodyを直接使用

    try {
        const { data, error } = await supabase
            .from('journal_entries')
            .update(updatedJournalEntryData)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json(data[0]);
    } catch (error) {
        console.error(`Error updating journal entry ${id}:`, error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/journal-entries', async (req, res) => {
  const newEntry = req.body; // req.bodyを直接使用
  if (!newEntry.date || !newEntry.description || !newEntry.debit_account_id || !newEntry.credit_account_id || !newEntry.amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  newEntry.id = `entry_${crypto.randomUUID()}`;
  newEntry.amount = parseFloat(newEntry.amount);

  // RPC関数に渡すデータはキャメルケースに変換
  const rpcEntryData = {
    id: newEntry.id,
    date: newEntry.date,
    description: newEntry.description,
    debitAccountId: newEntry.debit_account_id, // スネークケースからキャメルケースへ
    creditAccountId: newEntry.credit_account_id, // スネークケースからキャメルケースへ
    amount: newEntry.amount
  };

  try {
    const { error } = await supabase.rpc('create_journal_entry', {
      entry_data: rpcEntryData, // キャメルケースに変換したデータを渡す
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