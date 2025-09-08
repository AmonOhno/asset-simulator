import React, { useState, useEffect } from 'react';
import { useFinancialStore, RecurringTransaction, RecurrenceFrequency } from '@asset-simulator/shared';

export const RecurringTransactionManager: React.FC = () => {
  const { 
    journalAccounts, 
    regularJournalEntries,
    addRegularJournalEntry,
    updateRegularJournalEntry,
    deleteRegularJournalEntry,
    executeRegularJournalEntry,
    fetchData
  } = useFinancialStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Partial<RecurringTransaction> | null>(null);
  const [dynamicAmount, setDynamicAmount] = useState<number | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<RecurringTransaction>>({
    name: '',
    description: '',
    debitAccountId: '',
    creditAccountId: '',
    amount: undefined,
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    dayOfMonth: 1,
    activeFlg: true
  });

  // データ読み込み
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 次の実行予定日を計算
  const getNextExecutionDate = (transaction: RecurringTransaction): Date => {
    const startDate = new Date(transaction.startDate || new Date());
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
        const dayOfMonth = transaction.dayOfMonth || 1;
        nextDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
        if (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
      case 'yearly':
        nextDate = new Date(today.getFullYear(), startDate.getMonth(), startDate.getDate());
        if (nextDate <= today) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        break;
    }

    return nextDate;
  };

  // 実行可能な取引を取得
  const getExecutableTransactions = (): RecurringTransaction[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return regularJournalEntries
      .filter((transaction: RecurringTransaction) => transaction.activeFlg)
      .filter((transaction: RecurringTransaction) => {
        const nextExecution = getNextExecutionDate(transaction);
        nextExecution.setHours(0, 0, 0, 0);
        return nextExecution <= today;
      });
  };

  // 新規作成または編集開始
  const startEdit = (transaction?: RecurringTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({ ...transaction });
    } else {
      setEditingTransaction(null);
      setFormData({
        name: '',
        description: '',
        debitAccountId: '',
        creditAccountId: '',
        amount: undefined,
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        dayOfMonth: 1,
        activeFlg: true
      });
    }
    setIsModalOpen(true);
  };

  // 保存
  const handleSave = async () => {
    if (!formData.name || !formData.debitAccountId || !formData.creditAccountId) {
      alert('必須項目を入力してください');
      return;
    }

    try {
      if (editingTransaction) {
        // 更新
        await updateRegularJournalEntry({
          ...editingTransaction,
          ...formData
        } as RecurringTransaction);
      } else {
        // 新規作成
        await addRegularJournalEntry(formData as Omit<RecurringTransaction, 'id'>);
      }
      setIsModalOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('定期取引の保存に失敗しました:', error);
      alert('保存に失敗しました');
    }
  };

  // 削除
  const handleDelete = async (id: number) => {
    if (window.confirm('この定期取引を削除しますか？')) {
      try {
        await deleteRegularJournalEntry(id);
      } catch (error) {
        console.error('定期取引の削除に失敗しました:', error);
        alert('削除に失敗しました');
      }
    }
  };

  // 実行
  const executeTransaction = async (transaction: RecurringTransaction, amount?: number) => {
    try {
      await executeRegularJournalEntry(transaction.id, amount);
      alert('定期取引を実行しました');
    } catch (error) {
      console.error('定期取引の実行に失敗しました:', error);
      alert('実行に失敗しました');
    }
  };

  return (
    <div className="recurring-transaction-manager" style={{
      padding: '20px'
    }}>
      <h2>定期取引管理</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => startEdit()} 
          style={{
            padding: '8px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          新規定期取引
        </button>
      </div>

      {/* 実行可能な取引 */}
      <div style={{
        marginBottom: '30px',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>実行可能な取引</h3>
        {getExecutableTransactions().length === 0 ? (
          <p>実行可能な定期取引はありません</p>
        ) : (
          <div>
            {getExecutableTransactions().map((transaction: RecurringTransaction) => (
              <div key={transaction.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                marginBottom: '10px',
                background: 'white',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>
                    {transaction.name}
                  </strong>
                  <span style={{ color: '#666', fontSize: '0.9em', display: 'block', marginBottom: '4px' }}>
                    {transaction.description}
                  </span>
                  <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                    {transaction.amount ? `¥${transaction.amount?.toLocaleString()}` : '金額未設定'}
                  </span>
                </div>
                <div>
                  {!transaction.amount ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="number"
                        value={dynamicAmount || ''}
                        onChange={(e) => setDynamicAmount(Number(e.target.value))}
                        placeholder="金額を入力"
                        style={{
                          width: '120px',
                          padding: '5px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                      <button 
                        onClick={() => executeTransaction(transaction, dynamicAmount)}
                        disabled={!dynamicAmount}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: dynamicAmount ? '#16a34a' : '#ccc',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: dynamicAmount ? 'pointer' : 'not-allowed'
                        }}
                      >
                        実行
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => executeTransaction(transaction)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      実行
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 全定期取引一覧 */}
      <div>
        <h3>定期取引一覧</h3>
        {regularJournalEntries.length === 0 ? (
          <p>定期取引が登録されていません</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {regularJournalEntries.map((transaction: RecurringTransaction) => {
              const debitAccount = journalAccounts.find(acc => acc.id === transaction.debitAccountId);
              const creditAccount = journalAccounts.find(acc => acc.id === transaction.creditAccountId);
              const nextExecution = getNextExecutionDate(transaction);

              return (
                <div key={transaction.id} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  background: 'white'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '15px'
                  }}>
                    <h4 style={{ margin: 0, flex: 1 }}>{transaction.name}</h4>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        onClick={() => startEdit(transaction)}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        編集
                      </button>
                      <button 
                        onClick={() => handleDelete(transaction.id)}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <p style={{ color: '#666', marginBottom: '10px' }}>{transaction.description}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold', color: '#555' }}>借方:</span>
                        <span>{debitAccount?.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold', color: '#555' }}>貸方:</span>
                        <span>{creditAccount?.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold', color: '#555' }}>金額:</span>
                        <span>
                          {transaction.amount ? `¥${transaction.amount.toLocaleString()}` : '動的金額'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold', color: '#555' }}>頻度:</span>
                        <span>{transaction.frequency}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold', color: '#555' }}>次回実行:</span>
                        <span>{nextExecution.toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold', color: '#555' }}>ステータス:</span>
                        <span style={{
                          color: transaction.activeFlg ? '#16a34a' : '#dc2626',
                          fontWeight: 'bold'
                        }}>
                          {transaction.activeFlg ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3>{editingTransaction ? '定期取引編集' : '新規定期取引'}</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                取引名 *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="取引名を入力"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                説明
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="説明を入力"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  height: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                借方勘定 *
              </label>
              <select
                value={formData.debitAccountId || ''}
                onChange={(e) => setFormData({ ...formData, debitAccountId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">選択してください</option>
                {journalAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                貸方勘定 *
              </label>
              <select
                value={formData.creditAccountId || ''}
                onChange={(e) => setFormData({ ...formData, creditAccountId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">選択してください</option>
                {journalAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                金額 (0または空白で動的金額)
              </label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  amount: e.target.value ? Number(e.target.value) : undefined 
                })}
                placeholder="金額を入力（0で動的金額）"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                頻度
              </label>
              <select
                value={formData.frequency || 'monthly'}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  frequency: e.target.value as RecurrenceFrequency 
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
                <option value="monthly">毎月</option>
                <option value="yearly">毎年</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                開始日
              </label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {formData.frequency === 'monthly' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  実行日
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth || 1}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dayOfMonth: Number(e.target.value) 
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {formData.frequency === 'weekly' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  曜日
                </label>
                <select
                  value={formData.dayOfWeek || 0}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dayOfWeek: Number(e.target.value) 
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
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
            )}

            <div style={{ marginBottom: '15px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.activeFlg !== false}
                  onChange={(e) => setFormData({ ...formData, activeFlg: e.target.checked })}
                  style={{ marginRight: '8px' }}
                />
                アクティブ
              </label>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              marginTop: '20px'
            }}>
              <button 
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                保存
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringTransactionManager;
