import React, { useState, useEffect } from 'react';
import { useFinancialStore, RecurringTransaction, RecurrenceFrequency } from '@asset-simulator/shared';

export const RecurringTransactionManager: React.FC = () => {
  const { journalAccounts, addJournalEntry } = useFinancialStore();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Partial<RecurringTransaction>>({
    name: '',
    description: '',
    debitAccountId: '',
    creditAccountId: '',
    amount: 0,
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    dayOfMonth: 1,
    isActive: true
  });

  // ローカルストレージから定期取引を読み込み
  useEffect(() => {
    const saved = localStorage.getItem('recurringTransactions');
    if (saved) {
      setRecurringTransactions(JSON.parse(saved));
    }
  }, []);

  // ローカルストレージに保存
  const saveToLocalStorage = (transactions: RecurringTransaction[]) => {
    localStorage.setItem('recurringTransactions', JSON.stringify(transactions));
  };

  // 次の実行予定日を計算
  const getNextExecutionDate = (transaction: RecurringTransaction): Date => {
    const startDate = new Date(transaction.startDate);
    const today = new Date();
    let nextDate = new Date(startDate);

    switch (transaction.frequency) {
      case 'daily':
        nextDate = new Date(today);
        nextDate.setDate(today.getDate() + 1);
        break;
      case 'weekly':
        nextDate = new Date(today);
        const dayOfWeek = transaction.dayOfWeek || 0;
        const daysUntilNext = (dayOfWeek - today.getDay() + 7) % 7;
        nextDate.setDate(today.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        break;
      case 'monthly':
        nextDate = new Date(today.getFullYear(), today.getMonth(), transaction.dayOfMonth || 1);
        if (nextDate <= today) {
          nextDate = new Date(today.getFullYear(), today.getMonth() + 1, transaction.dayOfMonth || 1);
        }
        break;
      case 'yearly':
        nextDate = new Date(startDate);
        nextDate.setFullYear(today.getFullYear());
        if (nextDate <= today) {
          nextDate.setFullYear(today.getFullYear() + 1);
        }
        break;
    }

    return nextDate;
  };

  // 実行予定の取引を取得（今日から7日以内）
  const getUpcomingTransactions = () => {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    return recurringTransactions
      .filter(transaction => transaction.isActive)
      .map(transaction => ({
        ...transaction,
        nextExecutionDate: getNextExecutionDate(transaction)
      }))
      .filter(item => item.nextExecutionDate <= sevenDaysLater)
      .sort((a, b) => a.nextExecutionDate.getTime() - b.nextExecutionDate.getTime());
  };

  // 定期取引を追加
  const handleAddTransaction = () => {
    if (!editingTransaction.name || !editingTransaction.debitAccountId || !editingTransaction.creditAccountId) {
      alert('必須項目を入力してください');
      return;
    }

    const newTransaction: RecurringTransaction = {
      id: `recurring_${Date.now()}`,
      name: editingTransaction.name || '',
      description: editingTransaction.description || '',
      debitAccountId: editingTransaction.debitAccountId || '',
      creditAccountId: editingTransaction.creditAccountId || '',
      amount: editingTransaction.amount || 0,
      frequency: editingTransaction.frequency || 'monthly',
      startDate: editingTransaction.startDate || new Date().toISOString().split('T')[0],
      endDate: editingTransaction.endDate,
      dayOfMonth: editingTransaction.dayOfMonth,
      dayOfWeek: editingTransaction.dayOfWeek,
      isActive: editingTransaction.isActive !== false
    };

    const updated = [...recurringTransactions, newTransaction];
    setRecurringTransactions(updated);
    saveToLocalStorage(updated);
    setIsModalOpen(false);
    resetForm();
  };

  // 定期取引を実行（仕訳を作成）
  const executeTransaction = async (transaction: RecurringTransaction) => {
    const today = new Date().toISOString().split('T')[0];
    
    const journalEntry = {
      id: `entry_${Date.now()}`,
      date: today,
      description: transaction.description,
      debitAccountId: transaction.debitAccountId,
      creditAccountId: transaction.creditAccountId,
      amount: transaction.amount
    };

    try {
      await addJournalEntry(journalEntry);
      
      // 最後に実行された日付を更新
      const updated = recurringTransactions.map(t => 
        t.id === transaction.id 
          ? { ...t, lastExecuted: today }
          : t
      );
      setRecurringTransactions(updated);
      saveToLocalStorage(updated);
      
      alert(`「${transaction.name}」の仕訳を作成しました`);
    } catch (error) {
      alert('仕訳の作成に失敗しました');
    }
  };

  // フォームリセット
  const resetForm = () => {
    setEditingTransaction({
      name: '',
      description: '',
      debitAccountId: '',
      creditAccountId: '',
      amount: 0,
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      dayOfMonth: 1,
      isActive: true
    });
  };

  // 勘定科目名を取得
  const getAccountName = (accountId: string) => {
    const account = journalAccounts.find(acc => acc.id === accountId);
    return account?.name || '不明';
  };

  const upcomingTransactions = getUpcomingTransactions();

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">定期取引リマインド</h5>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            新規追加
          </button>
        </div>
      </div>
      <div className="card-body">
        {/* 実行予定の取引 */}
        {upcomingTransactions.length > 0 && (
          <div className="alert alert-info">
            <h6 className="alert-heading">今後7日間の実行予定</h6>
            {upcomingTransactions.map(item => (
              <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <strong>{item.name}</strong>
                  <br />
                  <small className="text-muted">
                    {item.nextExecutionDate.toLocaleDateString('ja-JP')} | 
                    {getAccountName(item.debitAccountId)} → {getAccountName(item.creditAccountId)} | 
                    ¥{item.amount.toLocaleString()}
                  </small>
                </div>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => executeTransaction(item)}
                >
                  実行
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 定期取引一覧 */}
        <table className="table table-sm">
          <thead>
            <tr>
              <th>取引名</th>
              <th>頻度</th>
              <th>金額</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {recurringTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted">
                  定期取引が登録されていません
                </td>
              </tr>
            ) : (
              recurringTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>
                    <strong>{transaction.name}</strong>
                    <br />
                    <small className="text-muted">{transaction.description}</small>
                  </td>
                  <td>
                    {transaction.frequency === 'daily' && '毎日'}
                    {transaction.frequency === 'weekly' && '毎週'}
                    {transaction.frequency === 'monthly' && `毎月${transaction.dayOfMonth}日`}
                    {transaction.frequency === 'yearly' && '毎年'}
                  </td>
                  <td>¥{transaction.amount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${transaction.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {transaction.isActive ? 'アクティブ' : '停止中'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-outline-primary btn-sm me-1"
                      onClick={() => executeTransaction(transaction)}
                      disabled={!transaction.isActive}
                    >
                      実行
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        const updated = recurringTransactions.map(t => 
                          t.id === transaction.id 
                            ? { ...t, isActive: !t.isActive }
                            : t
                        );
                        setRecurringTransactions(updated);
                        saveToLocalStorage(updated);
                      }}
                    >
                      {transaction.isActive ? '停止' : '開始'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 新規追加モーダル */}
      {isModalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">定期取引の追加</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">取引名</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingTransaction.name}
                      onChange={(e) => setEditingTransaction({...editingTransaction, name: e.target.value})}
                      placeholder="例：家賃支払い"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">摘要</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingTransaction.description}
                      onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                      placeholder="例：事務所家賃"
                    />
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">借方勘定科目</label>
                    <select
                      className="form-select"
                      value={editingTransaction.debitAccountId}
                      onChange={(e) => setEditingTransaction({...editingTransaction, debitAccountId: e.target.value})}
                    >
                      <option value="">選択してください</option>
                      {journalAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">貸方勘定科目</label>
                    <select
                      className="form-select"
                      value={editingTransaction.creditAccountId}
                      onChange={(e) => setEditingTransaction({...editingTransaction, creditAccountId: e.target.value})}
                    >
                      <option value="">選択してください</option>
                      {journalAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">金額</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editingTransaction.amount}
                      onChange={(e) => setEditingTransaction({...editingTransaction, amount: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">頻度</label>
                    <select
                      className="form-select"
                      value={editingTransaction.frequency}
                      onChange={(e) => setEditingTransaction({...editingTransaction, frequency: e.target.value as RecurrenceFrequency})}
                    >
                      <option value="daily">毎日</option>
                      <option value="weekly">毎週</option>
                      <option value="monthly">毎月</option>
                      <option value="yearly">毎年</option>
                    </select>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">開始日</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editingTransaction.startDate}
                      onChange={(e) => setEditingTransaction({...editingTransaction, startDate: e.target.value})}
                    />
                  </div>
                </div>

                {editingTransaction.frequency === 'monthly' && (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">実行日（月の何日）</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="31"
                        value={editingTransaction.dayOfMonth}
                        onChange={(e) => setEditingTransaction({...editingTransaction, dayOfMonth: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                )}

                {editingTransaction.frequency === 'weekly' && (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">曜日</label>
                      <select
                        className="form-select"
                        value={editingTransaction.dayOfWeek}
                        onChange={(e) => setEditingTransaction({...editingTransaction, dayOfWeek: parseInt(e.target.value)})}
                      >
                        <option value={0}>日曜日</option>
                        <option value={1}>月曜日</option>
                        <option value={2}>火曜日</option>
                        <option value={3}>水曜日</option>
                        <option value={4}>木曜日</option>
                        <option value={5}>金曜日</option>
                        <option value={6}>土曜日</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  キャンセル
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddTransaction}
                >
                  追加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
