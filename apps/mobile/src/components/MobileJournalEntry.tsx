import React, { useState } from 'react';
import { useFinancialStore } from '@asset-simulator/shared';

const MobileJournalEntry: React.FC = () => {
  const { accounts, addJournalEntry } = useFinancialStore();
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debitAccountId || !creditAccountId || !amount) return;

    setIsSubmitting(true);
    try {
      await addJournalEntry({
        id: '',
        date: new Date().toISOString().split('T')[0],
        debitAccountId: debitAccountId,
        creditAccountId: creditAccountId,
        amount: parseFloat(amount),
        description
      });
      
      // Reset form
      setDebitAccountId('');
      setCreditAccountId('');
      setAmount('');
      setDescription('');
    } catch (error) {
      console.error('Failed to add journal entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-journal-entry">
      <div className="mobile-card">
        <h2 className="mobile-title">新規仕訳</h2>
        <form onSubmit={handleSubmit} className="mobile-form">
          <div className="mobile-form-group">
            <label className="mobile-label">借方勘定</label>
            <select
              value={debitAccountId}
              onChange={(e) => setDebitAccountId(e.target.value)}
              className="mobile-select"
              required
            >
              <option value="">勘定科目を選択</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">貸方勘定</label>
            <select
              value={creditAccountId}
              onChange={(e) => setCreditAccountId(e.target.value)}
              className="mobile-select"
              required
            >
              <option value="">勘定科目を選択</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">金額</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mobile-input"
              placeholder="金額を入力"
              step="0.01"
              required
            />
          </div>

          <div className="mobile-form-group">
            <label className="mobile-label">摘要</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mobile-input"
              placeholder="摘要を入力（任意）"
            />
          </div>

          <button
            type="submit"
            className={`mobile-submit-btn ${isSubmitting ? 'submitting' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? '処理中...' : '仕訳を追加'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MobileJournalEntry;
