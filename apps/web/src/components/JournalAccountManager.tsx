
import React, { useState } from 'react';
import { useFinancialStore } from '@asset-simulator/shared';
import { JournalAccount } from '@asset-simulator/shared';

export const JournalAccountManager: React.FC = () => {
  const { journalAccounts, addJournalAccount, updateJournalAccount } = useFinancialStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Omit<JournalAccount, 'id'> | JournalAccount>({
    name: '',
    category: 'Expense',
    balance: 0,
    user_id: ''
  });

  const isSystemAccount = (id: string) => id.startsWith('acc_') || id.startsWith('card_');

  const resetForm = () => {
    setIsEditing(false);
    setCurrentAccount({ name: '', category: 'Expense', balance: 0, user_id: '' });
  };

  const handleEditClick = (account: JournalAccount) => {
    setIsEditing(true);
    setCurrentAccount(account);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateJournalAccount(currentAccount as JournalAccount);
    } else {
      addJournalAccount(currentAccount as Omit<JournalAccount, 'id'>);
    }
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentAccount(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card">
      <div className="card-header">勘定科目マスタ管理</div>
      <div className="card-body">
        <h5>{isEditing ? '勘定科目を編集' : '新しい勘定科目を追加'}</h5>
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label htmlFor="journalAccountName" className="form-label">勘定科目名</label>
            <input 
              type="text" 
              id="journalAccountName" 
              name="name"
              className="form-control" 
              value={currentAccount.name} 
              onChange={handleInputChange} 
              placeholder="例: 現金、売上、消耗品費"
              required 
            />
          </div>
          <div className="mb-3">
            <label htmlFor="journalAccountCategory" className="form-label">カテゴリ</label>
            <select 
              id="journalAccountCategory" 
              name="category"
              className="form-select" 
              value={currentAccount.category} 
              onChange={handleInputChange}
              disabled={isEditing && isSystemAccount((currentAccount as JournalAccount).id)}
            >
              <option value="Asset">資産</option>
              <option value="Liability">負債</option>
              <option value="Equity">純資産</option>
              <option value="Revenue">収益</option>
              <option value="Expense">費用</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">{isEditing ? '更新' : '追加'}</button>
          {isEditing && <button type="button" className="btn btn-secondary ms-2" onClick={resetForm}>キャンセル</button>}
        </form>

        <h5>登録済み勘定科目</h5>
        <table className="table">
          <thead>
            <tr>
              <th>勘定科目名</th>
              <th>カテゴリ</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {journalAccounts.map(acc => (
              <tr key={acc.id}>
                <td>{acc.name}</td>
                <td>{acc.category}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditClick(acc)}>編集</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
