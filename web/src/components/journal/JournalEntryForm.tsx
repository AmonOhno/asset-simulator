// src/components/JournalEntryForm.tsx

import React, { useState } from 'react';
import { useFinancialStore } from '@asset-simulator/shared';

export const JournalEntryForm: React.FC = () => {
  const { journalAccounts, addJournalEntry } = useFinancialStore();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description || !debitAccountId || !creditAccountId || !amount) {
      alert('すべての項目を入力してください。');
      return;
    }

    addJournalEntry({
      date,
      description,
      debitAccountId,
      creditAccountId,
      amount: parseFloat(amount),
      user_id: ''
    });

    // フォームをリセット
    setDescription('');
    setDebitAccountId('');
    setCreditAccountId('');
    setAmount('');
  };

  return (
    <div className="card">
      <div className="card-header">仕訳入力</div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="date" className="form-label">日付</label>
            <input
              type="date"
              className="form-control"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="description" className="form-label">摘要</label>
            <input
              type="text"
              className="form-control"
              id="description"
              placeholder='例: 7月分給与'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="debitAccount" className="form-label">借方勘定科目</label>
              <select
                className="form-select"
                id="debitAccount"
                value={debitAccountId}
                onChange={(e) => setDebitAccountId(e.target.value)}
                required
              >
                <option value="">選択してください</option>
                {journalAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="col">
              <label htmlFor="creditAccount" className="form-label">貸方勘定科目</label>
              <select
                className="form-select"
                id="creditAccount"
                value={creditAccountId}
                onChange={(e) => setCreditAccountId(e.target.value)}
                required
              >
                <option value="">選択してください</option>
                {journalAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.category})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="amount" className="form-label">金額</label>
            <div className="input-group">
              <span className="input-group-text">¥</span>
              <input
                type="number"
                className="form-control"
                id="amount"
                placeholder='10000'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">登録</button>
        </form>
      </div>
    </div>
  );
};