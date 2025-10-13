import React, { useState, useEffect } from 'react';
import { useFinancialStore, RecurringTransaction, RecurrenceFrequency, JournalEntry, HolidayDivOfMonth } from '@asset-simulator/shared';

export const RecurringTransactionManager: React.FC = () => {
  const { 
    journalAccounts, 
    regularJournalEntries,
    addRegularJournalEntry,
    updateRegularJournalEntry,
    deleteRegularJournalEntry,
    addJournalEntry, // Added for execution
    fetchFinancial
  } = useFinancialStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Partial<RecurringTransaction> | null>(null);
  const [formData, setFormData] = useState<Partial<RecurringTransaction>>({});

  // データ読み込み
  useEffect(() => {
    fetchFinancial();
  }, [fetchFinancial]);

  // 次の実行予定日を計算
  const getNextExecutionDate = (transaction: RecurringTransaction): Date | undefined => {
    const startDate = new Date(transaction.startDate || new Date());
    const endDate = new Date(transaction.endDate || new Date());
    const today = new Date();
    if (endDate && today > endDate) {
      // 終了日を過ぎている場合は次の実行日を計算しない
      return undefined;
    }
    let nextDate = new Date(startDate);

    switch (transaction.frequency) {
      case 'weekly':
        const daysOfWeek = [
          transaction.sunFlgOfWeek,
          transaction.monFlgOfWeek,
          transaction.tueFlgOfWeek,
          transaction.wedFlgOfWeek,
          transaction.thuFlgOfWeek,
          transaction.friFlgOfWeek,
          transaction.satFlgOfWeek
        ];
        const todayIndex = today.getDay();
        const nextDayIndex = daysOfWeek.findIndex((flag, index) => flag && index > todayIndex);
        if (nextDayIndex === -1) {
          nextDate.setDate(today.getDate() + 7 - todayIndex + daysOfWeek.findIndex(flag => flag));
        } else {
          nextDate.setDate(today.getDate() + (nextDayIndex - todayIndex));
        }
        break;
      case 'monthly':
        const dateOfMonth = transaction.dateOfMonth || 1;
        nextDate = new Date(today.getFullYear(), today.getMonth(), dateOfMonth);
        if (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;
      case 'yearly':
        const [month, day] = transaction.dateOfYear.split('-').map(Number);
        nextDate = new Date(today.getFullYear(), month - 1, day);
        if (nextDate <= today) {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        break;
    }

    return nextDate;
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
        frequency: 'weekly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dateOfMonth: 1,
        dateOfYear: new Date().toISOString().split('T')[0], // Added for yearly transactions
        holidayDivOfMonth: 'none', // Added for monthly transactions
        monFlgOfWeek: false, // Added for weekly transactions
        tueFlgOfWeek: false,
        wedFlgOfWeek: false,
        thuFlgOfWeek: false,
        friFlgOfWeek: false,
        satFlgOfWeek: false,
        sunFlgOfWeek: false,
        publicHolidayExFlgOfWeek: false,
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
  const executeTransaction = async (transaction: RecurringTransaction) => {
    const startDate = new Date(transaction.startDate || new Date());
    const endDate = new Date(transaction.endDate || new Date());
    const executionDates: Date[] = [];

    // 実行日リストを作成
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      switch (transaction.frequency) {
        case 'weekly':
          if (currentDate.getDay() === 0 && transaction.sunFlgOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          if (currentDate.getDay() === 1 && transaction.monFlgOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          if (currentDate.getDay() === 2 && transaction.tueFlgOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          if (currentDate.getDay() === 3 && transaction.wedFlgOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          if (currentDate.getDay() === 4 && transaction.thuFlgOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          if (currentDate.getDay() === 5 && transaction.friFlgOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          if (currentDate.getDay() === 6 && transaction.satFlgOfWeek) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          executionDates.push(new Date(currentDate));
          break;
        case 'monthly':
          currentDate.setDate(transaction.dateOfMonth);
          if (transaction.holidayDivOfMonth === 'before') {
            if (currentDate.getDay() === 0) { // 日曜日
                currentDate.setDate(currentDate.getDate() - 2);
            } else if (currentDate.getDay() === 6) { // 土曜日
              currentDate.setDate(currentDate.getDate() - 1);
            }
          } else if (transaction.holidayDivOfMonth === 'after') {
            if (currentDate.getDay() === 0) { // 日曜日
              currentDate.setDate(currentDate.getDate() + 1);
            } else if (currentDate.getDay() === 6) { // 土曜日
              currentDate.setDate(currentDate.getDate() + 2);
            }
          }
          executionDates.push(new Date(currentDate));
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          executionDates.push(new Date(currentDate));
          break;
      }
    }

    // 各実行日に対して取引を実行
    for (const date of executionDates) {
      const journalEntryData: Omit<JournalEntry, 'id'> = {
        date: date.toISOString().split('T')[0], // 取引日 (YYYY-MM-DD)
        description: transaction.description,
        debitAccountId: transaction.debitAccountId,
        creditAccountId: transaction.creditAccountId,
        amount: transaction.amount,
        user_id: ''
      };

      try {
        await addJournalEntry(journalEntryData);
      } catch (error) {
        console.error('定期取引の実行に失敗しました:', error);
        alert('一部の取引実行に失敗しました');
      }
    }

    alert('定期取引をすべて実行しました');
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
                        onClick={() => executeTransaction(transaction)}
                        style={{
                          backgroundColor: '#16a34a',
                          color: 'white',
                          padding: '4px 8px',
                          fontSize: '12px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        実行
                      </button>
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
                        <span>{nextExecution?.toLocaleDateString()}</span>
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
                金額
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
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                終了日
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                <option value="weekly">毎週</option>
                <option value="monthly">毎月</option>
                <option value="yearly">毎年</option>
                <option value="free">適宜</option>
              </select>
            </div>

            {formData.frequency === 'free' && (
              <div style={{ marginBottom: '15px', color: '#666' }}>
                <em>自由形式の定期取引は次回実行日が自動計算されません。手動で実行してください。</em>
              </div>
            )}

            {formData.frequency === 'monthly' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  実行日
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dateOfMonth || 1}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dateOfMonth: Number(e.target.value) 
                  })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                />
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  休日調整
                </label>
                <select
                  value={formData.holidayDivOfMonth || 'none'}
                  onChange={(e) => setFormData({ ...formData, holidayDivOfMonth: e.target.value as HolidayDivOfMonth })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="none" defaultChecked>なし</option>
                  <option value="before">前倒し</option>
                  <option value="after">後ろ倒し</option>
                </select>
              </div>
            )}

            {formData.frequency === 'weekly' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  曜日
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.monFlgOfWeek || false}
                      onChange={(e) => setFormData({ ...formData, monFlgOfWeek: e.target.checked })}
                    /> 月
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.tueFlgOfWeek || false}
                      onChange={(e) => setFormData({ ...formData, tueFlgOfWeek: e.target.checked })}
                    /> 火
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.wedFlgOfWeek || false}
                      onChange={(e) => setFormData({ ...formData, wedFlgOfWeek: e.target.checked })}
                    /> 水
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.thuFlgOfWeek || false}
                      onChange={(e) => setFormData({ ...formData, thuFlgOfWeek: e.target.checked })}
                    /> 木
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.friFlgOfWeek || false}
                      onChange={(e) => setFormData({ ...formData, friFlgOfWeek: e.target.checked })}
                    /> 金
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.satFlgOfWeek || false}
                      onChange={(e) => setFormData({ ...formData, satFlgOfWeek: e.target.checked })}
                    /> 土
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.sunFlgOfWeek || false}
                      onChange={(e) => setFormData({ ...formData, sunFlgOfWeek: e.target.checked })}
                    /> 日
                  </label> 
                </div>
              </div>
            )}

            {formData.frequency === 'yearly' && (
              <div style={{ marginBottom: '15px' }}>
                <label>年次取引日 (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={formData.dateOfYear || ''}
                  onChange={(e) => setFormData({ ...formData, dateOfYear: e.target.value })}
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
