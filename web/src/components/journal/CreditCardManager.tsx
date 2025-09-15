
// src/components/CreditCardManager.tsx

import React, { useState } from 'react';
import { useFinancialStore } from '@asset-simulator/shared';
import { CreditCard } from '@asset-simulator/shared';
import { useScrollToTop } from '../../hooks/useScrollToTop';

export const CreditCardManager: React.FC = () => {
  const scrollToTop = useScrollToTop('credit-card-manager');
  const { creditCards, addCreditCard, updateCreditCard, accounts } = useFinancialStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentCard, setCurrentCard] = useState<Omit<CreditCard, 'id'> | CreditCard>({
    name: '',
    closingDay: 25,
    paymentDay: 10,
    linkedAccountId: '',
    user_id: ''
  });

  const resetCard = () => {
    setCurrentCard({
      name: '',
      closingDay: 25,
      paymentDay: 10,
      linkedAccountId: '',
      user_id: ''
    });
    setIsEditing(false);
  };

  const handleEditClick = (card: CreditCard) => {
    setIsEditing(true);
    setCurrentCard(card);
    scrollToTop();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCard.linkedAccountId) {
      alert('引落口座を選択してください。');
      return;
    }
    if (isEditing) {
      updateCreditCard(currentCard as CreditCard);
    } else {
      addCreditCard(currentCard as Omit<CreditCard, 'id'>);
    }
    resetCard();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentCard(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div id="credit-card-manager" className="card">
      <div className="card-header">クレジットカード管理</div>
      <div className="card-body card-body-scrollable">
        <h5>{isEditing ? 'カード情報を編集' : '新しいカードを追加'}</h5>
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label htmlFor="cardName" className="form-label">カード名</label>
            <input type="text" id="cardName" name="name" className="form-control" value={currentCard.name} onChange={handleInputChange} placeholder="例: 楽天カード" required />
          </div>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="closingDay" className="form-label">締め日</label>
              <input type="number" id="closingDay" name="closingDay" className="form-control" value={currentCard.closingDay} onChange={handleInputChange} min="1" max="31" required />
            </div>
            <div className="col">
              <label htmlFor="paymentDay" className="form-label">支払日</label>
              <input type="number" id="paymentDay" name="paymentDay" className="form-control" value={currentCard.paymentDay} onChange={handleInputChange} min="1" max="31" required />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="linkedAccount" className="form-label">引落口座</label>
            <select 
              id="linkedAccount"
              name="linkedAccountId"
              className="form-select"
              value={currentCard.linkedAccountId}
              onChange={handleInputChange}
              required
            >
              <option value="">選択してください</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">{isEditing ? '更新' : '追加'}</button>
          {isEditing && <button type="button" className="btn btn-secondary ms-2" onClick={resetCard}>キャンセル</button>}
        </form>

        <h5>登録済みカード</h5>
        <table className="table">
          <thead>
            <tr>
              <th>カード名</th>
              <th>締め日</th>
              <th>支払日</th>
              <th>引落口座</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {creditCards.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">登録されたカードはありません</td>
              </tr>
            ) : (
              creditCards.map(card => (
                <tr key={card.id}>
                  <td>{card.name}</td>
                  <td>{card.closingDay}</td>
                  <td>{card.paymentDay}</td>
                  <td>
                    {accounts.find(acc => acc.id === card.linkedAccountId)?.name || '不明'}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditClick(card)}>編集</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
