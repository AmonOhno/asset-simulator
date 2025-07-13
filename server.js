const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// データベース接続
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error("DB Connection Error:", err.message);
  }
  console.log('Connected to the SQLite database.');
});

// テーブル作成
db.serialize(() => {
  // テーブル作成（存在しない場合）
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    institution TEXT,
    branchNumber TEXT,
    type TEXT NOT NULL,
    accountNumber TEXT,
    accountHolder TEXT
  )`, (err) => {
    if (err) console.error("Table Creation Error (accounts):", err.message);
  });

  // accountsテーブルのスキーママイグレーション
  const migrateAccountsTable = () => {
    const columns = [
      { name: 'institution', type: 'TEXT' },
      { name: 'type', type: 'TEXT' },
      { name: 'initialBalance', type: 'REAL' }
    ];

    db.all("PRAGMA table_info(accounts)", (err, existingColumns) => {
      if (err) {
        console.error("Failed to get table info:", err);
        return;
      }

      const existingColumnNames = existingColumns.map(c => c.name);

      columns.forEach(col => {
        if (!existingColumnNames.includes(col.name)) {
          db.run(`ALTER TABLE accounts ADD COLUMN ${col.name} ${col.type}`, (alterErr) => {
            if (alterErr) {
              console.error(`Failed to add column ${col.name}:`, alterErr);
            } else {
              console.log(`Column ${col.name} added to accounts table.`);
            }
          });
        }
      });
    });
  };
  migrateAccountsTable();


  db.run(`CREATE TABLE IF NOT EXISTS credit_cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    closingDay INTEGER,
    paymentDay INTEGER,
    linkedAccountId TEXT
  )`, (err) => {
    if (err) console.error("Table Creation Error (credit_cards):", err.message);
  });

  db.run(`CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    debitAccountId TEXT NOT NULL,
    creditAccountId TEXT NOT NULL,
    amount REAL NOT NULL
  )`, (err) => {
    if (err) console.error("Table Creation Error (journal_entries):", err.message);
  });

  db.run(`CREATE TABLE IF NOT EXISTS journal_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL
  )`, (err) => {
    if (err) {
      console.error("Table Creation Error (journal_accounts):", err.message);
      return;
    }
    // Seed initial journal accounts if the table is empty
    db.get("SELECT COUNT(*) as count FROM journal_accounts", (err, row) => {
      if (err) {
        console.error("Failed to check journal_accounts count:", err);
        return;
      }
      if (row.count === 0) {
        console.log("Seeding initial journal accounts...");
        const stmt = db.prepare("INSERT INTO journal_accounts (id, name, category) VALUES (?, ?, ?)");
        const defaultAccounts = [
          // Assets
          { id: `jacc_${crypto.randomUUID()}`, name: '現金', category: 'Asset' },
          { id: `jacc_${crypto.randomUUID()}`, name: 'Suica', category: 'Asset' },
          // Liabilities
          { id: `jacc_${crypto.randomUUID()}`, name: '借入金', category: 'Liability' },
          // Equity (usually handled by system)
          // Revenues
          { id: `jacc_${crypto.randomUUID()}`, name: '給与', category: 'Revenue' },
          { id: `jacc_${crypto.randomUUID()}`, name: '賞与', category: 'Revenue' },
          { id: `jacc_${crypto.randomUUID()}`, name: '雑収入', category: 'Revenue' },
          // Expenses
          { id: `jacc_${crypto.randomUUID()}`, name: '食費', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '消耗品費', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '交通費', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '娯楽費', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '家賃', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '水道光熱費', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '通信費', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '保険料', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '医療費', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '交際費', category: 'Expense' },
          { id: `jacc_${crypto.randomUUID()}`, name: '雑費', category: 'Expense' },
        ];
        defaultAccounts.forEach(acc => {
          stmt.run(acc.id, acc.name, acc.category);
        });
        stmt.finalize();
        console.log("Finished seeding journal accounts.");
      }
    });
  });
});

// APIエンドポイント

// 勘定科目
app.get('/api/accounts', (req, res) => {
  console.log("GET /api/accounts received");
  db.all('SELECT * FROM accounts', [], (err, rows) => {
    if (err) {
      console.error("DB Error (GET /api/accounts):", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/accounts', (req, res) => {
  console.log("POST /api/accounts received with body:", req.body);
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

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('INSERT INTO accounts (id, name, institution, branchNumber, type, accountNumber, accountHolder) VALUES (?, ?, ?, ?, ?, ?, ?)', 
      [newAccount.id, newAccount.name, newAccount.institution, newAccount.branchNumber, newAccount.type, newAccount.accountNumber, newAccount.accountHolder], 
      function (err) {
        if (err) {
          console.error("DB Error (POST /api/accounts - accounts):", err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      }
    );
    db.run('INSERT INTO journal_accounts (id, name, category) VALUES (?, ?, ?)', 
      [newAccount.id, newAccount.name, 'Asset'], 
      function (err) {
        if (err) {
          console.error("DB Error (POST /api/accounts - journal_accounts):", err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      }
    );
    db.run('COMMIT', (err) => {
      if (err) {
        console.error("DB Error (COMMIT /api/accounts):", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(newAccount);
    });
  });
});

app.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const { name, institution, branchNumber, type, accountNumber, accountHolder } = req.body;

  if (!name || !institution || !branchNumber || !type || !accountNumber || !accountHolder) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const updatedAccount = { id, name, institution, branchNumber, type, accountNumber, accountHolder };

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'UPDATE accounts SET name = ?, institution = ?, branchNumber = ?, type = ?, accountNumber = ?, accountHolder = ? WHERE id = ?',
      [updatedAccount.name, updatedAccount.institution, updatedAccount.branchNumber, updatedAccount.type, updatedAccount.accountNumber, updatedAccount.accountHolder, id],
      function (err) {
        if (err) {
          console.error("DB Error (PUT /api/accounts/:id - accounts):", err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      }
    );

    // Also update the name in journal_accounts table
    db.run(
      'UPDATE journal_accounts SET name = ? WHERE id = ?',
      [updatedAccount.name, id],
      function (err) {
        if (err) {
          console.error("DB Error (PUT /api/accounts/:id - journal_accounts):", err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      }
    );

    db.run('COMMIT', (err) => {
      if (err) {
        console.error("DB Error (COMMIT /api/accounts/:id):", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(updatedAccount);
    });
  });
});

// クレジットカード
app.get('/api/credit-cards', (req, res) => {
  console.log("GET /api/credit-cards received");
  db.all('SELECT * FROM credit_cards', [], (err, rows) => {
    if (err) {
      console.error("DB Error (GET /api/credit-cards):", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/credit-cards', (req, res) => {
  console.log("POST /api/credit-cards received with body:", req.body);
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

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('INSERT INTO credit_cards (id, name, closingDay, paymentDay, linkedAccountId) VALUES (?, ?, ?, ?, ?)', 
      [newCard.id, newCard.name, newCard.closingDay, newCard.paymentDay, newCard.linkedAccountId], 
      function (err) {
        if (err) {
          console.error("DB Error (POST /api/credit-cards - credit_cards):", err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      }
    );
    db.run('INSERT INTO journal_accounts (id, name, category) VALUES (?, ?, ?)', 
      [newCard.id, newCard.name, 'Liability'], 
      function (err) {
        if (err) {
          console.error("DB Error (POST /api/credit-cards - journal_accounts):", err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      }
    );
    db.run('COMMIT', (err) => {
      if (err) {
        console.error("DB Error (COMMIT /api/credit-cards):", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json(newCard);
    });
  });
});

app.put('/api/credit-cards/:id', (req, res) => {
  const { id } = req.params;
  const { name, closingDay, paymentDay, linkedAccountId } = req.body;

  if (!name || !closingDay || !paymentDay || !linkedAccountId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const updatedCard = { id, name, closingDay, paymentDay, linkedAccountId };

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'UPDATE credit_cards SET name = ?, closingDay = ?, paymentDay = ?, linkedAccountId = ? WHERE id = ?',
      [updatedCard.name, updatedCard.closingDay, updatedCard.paymentDay, updatedCard.linkedAccountId, id],
      function (err) {
        if (err) {
          console.error("DB Error (PUT /api/credit-cards/:id - credit_cards):", err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      }
    );

    db.run(
      'UPDATE journal_accounts SET name = ? WHERE id = ?',
      [updatedCard.name, id],
      function (err) {
        if (err) {
          console.error("DB Error (PUT /api/credit-cards/:id - journal_accounts):", err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
      }
    );

    db.run('COMMIT', (err) => {
      if (err) {
        console.error("DB Error (COMMIT /api/credit-cards/:id):", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json(updatedCard);
    });
  });
});

// 仕訳
app.get('/api/journal-entries', (req, res) => {
  console.log("GET /api/journal-entries received");
  db.all('SELECT * FROM journal_entries', [], (err, rows) => {
    if (err) {
      console.error("DB Error (GET /api/journal-entries):", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 勘定科目マスタ
app.get('/api/journal-accounts', (req, res) => {
  db.all('SELECT * FROM journal_accounts', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/journal-accounts', (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: "Missing required fields: name, category" });
  }
  const newJournalAccount = {
    id: `jacc_${crypto.randomUUID()}`,
    name,
    category
  };
  db.run('INSERT INTO journal_accounts (id, name, category) VALUES (?, ?, ?)', 
    [newJournalAccount.id, newJournalAccount.name, newJournalAccount.category], 
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(newJournalAccount);
    }
  );
});

app.put('/api/journal-accounts/:id', (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;

  if (!name || !category) {
    return res.status(400).json({ error: "Missing required fields: name, category" });
  }

  // For accounts/cards, we should not change the category.
  // We only allow changing the name for now.
  const stmt = db.prepare('UPDATE journal_accounts SET name = ?, category = ? WHERE id = ?');
  stmt.run(name, category, id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ id, name, category });
  });
});

app.post('/api/journal-entries', (req, res) => {
  console.log("POST /api/journal-entries received with body:", req.body);
  const { id, date, description, debitAccountId, creditAccountId, amount } = req.body;
  if (!id || !date || !description || !debitAccountId || !creditAccountId || amount === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  db.run('INSERT INTO journal_entries (id, date, description, debitAccountId, creditAccountId, amount) VALUES (?, ?, ?, ?, ?, ?)',
    [id, date, description, debitAccountId, creditAccountId, amount], function (err) {
    if (err) {
      console.error("DB Error (POST /api/journal-entries):", err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`A row has been inserted with rowid ${this.lastID}`);
    res.json({ id: this.lastID });
  });
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});