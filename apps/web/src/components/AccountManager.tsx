
// src/components/AccountManager.tsx

import React, { useState, useEffect } from 'react';
import { useFinancialStore } from '../shared';
import { Account } from '../shared';

export const AccountManager: React.FC = () => {
  const { accounts, addAccount, updateAccount } = useFinancialStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Omit<Account, 'id'> | Account>({
    name: '',
    institution: '',
    branchNumber: '',
    type: 'savings',
    accountNumber: '',
    accountHolder: ''
  });

  const resetForm = () => {
    setIsEditing(false);
    setCurrentAccount({
      name: '',
      institution: '',
      branchNumber: '',
      type: 'savings',
      accountNumber: '',
      accountHolder: ''
    });
  };

  const handleEditClick = (account: Account) => {
    setIsEditing(true);
    setCurrentAccount(account);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateAccount(currentAccount as Account);
    } else {
      addAccount(currentAccount as Omit<Account, 'id'>);
    }
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentAccount(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card">
      <div className="card-header">金融口座管理</div>
      <div className="card-body">
        <h5>{isEditing ? '口座情報を編集' : '新しい口座を追加'}</h5>
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label htmlFor="accountName" className="form-label">口座名</label>
            <input type="text" id="accountName" name="name" className="form-control" value={currentAccount.name} onChange={handleInputChange} placeholder="例: 三菱UFJ銀行" required />
          </div>
          <div className="mb-3">
            <label htmlFor="institution" className="form-label">金融機関</label>
            <input type="text" id="institution" name="institution" className="form-control" value={currentAccount.institution} onChange={handleInputChange} placeholder="例: 三菱UFJ銀行" required />
          </div>
          <div className="mb-3">
            <label htmlFor="branchNumber" className="form-label">支店番号</label>
            <input type="text" id="branchNumber" name="branchNumber" className="form-control" value={(currentAccount as any).branchNumber} onChange={handleInputChange} required />
          </div>
          <div className="mb-3">
            <label htmlFor="accountType" className="form-label">種別</label>
            <select id="accountType" name="type" className="form-select" value={currentAccount.type} onChange={handleInputChange}>
              <option value="savings">普通預金</option>
              <option value="checking">当座預金</option>
              <option value="investment">証券口座</option>
              <option value="other">その他</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="accountNumber" className="form-label">口座番号</label>
            <input type="text" id="accountNumber" name="accountNumber" className="form-control" value={currentAccount.accountNumber} onChange={handleInputChange} required />
          </div>
          <div className="mb-3">
            <label htmlFor="accountHolder" className="form-label">口座名義人</label>
            <input type="text" id="accountHolder" name="accountHolder" className="form-control" value={currentAccount.accountHolder} onChange={handleInputChange} required />
          </div>
          <button type="submit" className="btn btn-primary">{isEditing ? '更新' : '追加'}</button>
          {isEditing && <button type="button" className="btn btn-secondary ms-2" onClick={resetForm}>キャンセル</button>}
        </form>

        <h5>登録済み口座</h5>
        <table className="table">
          <thead>
            <tr>
              <th>口座名</th>
              <th>金融機関</th>
              <th>支店番号</th>
              <th>種別</th>
              <th>口座番号</th>
              <th>口座名義人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id}>
                <td>{acc.name}</td>
                <td>{acc.institution}</td>
                <td>{acc.branchNumber}</td>
                <td>{acc.type}</td>
                <td>{acc.accountNumber}</td>
                <td>{acc.accountHolder}</td>
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
