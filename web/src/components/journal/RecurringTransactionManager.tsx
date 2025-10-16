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
    executeDueRegularJournalEntries,
    fetchFinancial
  } = useFinancialStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Partial<RecurringTransaction> | null>(null);
  const [formData, setFormData] = useState<Partial<RecurringTransaction>>({});

  // データ読み込み
  useEffect(() => {
    fetchFinancial();
  }, [fetchFinancial]);

  // 自動実行機能 - ページ読み込み時に当日実行分をチェック
  useEffect(() => {
    const autoExecuteToday = async () => {
      try {
        const result = await executeDueRegularJournalEntries();
        if (result.executed > 0) {
          console.log(`${result.executed}件の定期取引を自動実行しました。`);
          // 必要に応じてアラートまたは通知を表示
        }
      } catch (error) {
        console.error('定期取引の自動実行に失敗しました:', error);
      }
    };

    // ページ読み込み時に自動実行
    autoExecuteToday();

    // 10分ごとに実行状況をチェック（重複実行を防ぐため間隔を延長）
    const interval = setInterval(autoExecuteToday, 600000); // 10分 = 600,000ms

    return () => clearInterval(interval);
  }, [executeDueRegularJournalEntries]);

  // 本日が実行日かどうかを判定
  const isTodayExecutionDate = (transaction: RecurringTransaction): boolean => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayDayOfWeek = today.getDay();

    // 開始日・終了日チェック
    if (transaction.startDate && todayStr < transaction.startDate) return false;
    if (transaction.endDate && todayStr > transaction.endDate) return false;

    switch (transaction.frequency) {
      case 'weekly':
        const dayFlags = [
          transaction.sunFlgOfWeek,  // 0: 日曜日
          transaction.monFlgOfWeek,  // 1: 月曜日
          transaction.tueFlgOfWeek,  // 2: 火曜日
          transaction.wedFlgOfWeek,  // 3: 水曜日
          transaction.thuFlgOfWeek,  // 4: 木曜日
          transaction.friFlgOfWeek,  // 5: 金曜日
          transaction.satFlgOfWeek   // 6: 土曜日
        ];
        
        // 基本的な曜日チェック
        if (!dayFlags[todayDayOfWeek]) return false;
        
        // 祝日・日曜日除外設定のチェック（サーバー側ロジックと合わせるためコメントアウト）
        // サーバー側では publicHolidayExFlgOfWeek の処理が実装されていないため
        /*
        if (transaction.publicHolidayExFlgOfWeek) {
          // 日曜日の場合は除外
          if (todayDayOfWeek === 0) return false;
          // 土曜日の場合も除外（平日のみ実行）
          if (todayDayOfWeek === 6) return false;
          // 実際の祝日判定は簡略化（必要に応じて祝日カレンダーAPIを使用）
        }
        */
        
        return true;
      
      case 'monthly':
        if (transaction.dateOfMonth) {
          const currentMonthLastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const targetDay = Math.min(transaction.dateOfMonth, currentMonthLastDay);
          let targetDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
          
          // 休日調整
          if (transaction.holidayDivOfMonth === 'before') {
            if (targetDate.getDay() === 0) { // 日曜日
              targetDate.setDate(targetDate.getDate() - 2);
            } else if (targetDate.getDay() === 6) { // 土曜日
              targetDate.setDate(targetDate.getDate() - 1);
            }
          } else if (transaction.holidayDivOfMonth === 'after') {
            if (targetDate.getDay() === 0) { // 日曜日
              targetDate.setDate(targetDate.getDate() + 1);
            } else if (targetDate.getDay() === 6) { // 土曜日
              targetDate.setDate(targetDate.getDate() + 2);
            }
          }
          
          return targetDate.toISOString().split('T')[0] === todayStr;
        }
        return false;
      
      case 'yearly':
        if (transaction.dateOfYear) {
          const [month, day] = transaction.dateOfYear.split('-').map(Number);
          let targetDate = new Date(today.getFullYear(), month - 1, day);
          
          // 休日調整
          if (transaction.holidayDivOfMonth === 'before') {
            if (targetDate.getDay() === 0) { // 日曜日
              targetDate.setDate(targetDate.getDate() - 2);
            } else if (targetDate.getDay() === 6) { // 土曜日
              targetDate.setDate(targetDate.getDate() - 1);
            }
          } else if (transaction.holidayDivOfMonth === 'after') {
            if (targetDate.getDay() === 0) { // 日曜日
              targetDate.setDate(targetDate.getDate() + 1);
            } else if (targetDate.getDay() === 6) { // 土曜日
              targetDate.setDate(targetDate.getDate() + 2);
            }
          }
          
          return targetDate.toISOString().split('T')[0] === todayStr;
        }
        return false;
      
      default:
        return false;
    }
  };

  // 次の実行予定日を計算
  const getNextExecutionDate = (transaction: RecurringTransaction): Date | undefined => {
    const endDate = new Date(transaction.endDate || new Date());
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (endDate && today > endDate) {
      // 終了日を過ぎている場合は次の実行日を計算しない
      return undefined;
    }

    // 本日が実行日で、まだ実行されていない場合は本日を返す
    if (isTodayExecutionDate(transaction) && transaction.lastExecutedDate !== todayStr) {
      return today;
    }

    let nextDate = new Date(today);

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
        let foundNextDay = false;
        
        // 今週の残り日数をチェック
        for (let i = todayIndex + 1; i < 7; i++) {
          if (daysOfWeek[i]) {
            // 祝日除外設定のチェック（サーバー側ロジックと合わせるためコメントアウト）
            /*
            if (transaction.publicHolidayExFlgOfWeek && (i === 0 || i === 6)) {
              continue; // 日曜日または土曜日はスキップ
            }
            */
            nextDate.setDate(today.getDate() + (i - todayIndex));
            foundNextDay = true;
            break;
          }
        }
        
        // 今週に該当日がない場合、来週以降をチェック
        if (!foundNextDay) {
          let weekOffset = 1;
          while (!foundNextDay) {
            for (let i = 0; i < 7; i++) {
              if (daysOfWeek[i]) {
                // 祝日除外設定のチェック（サーバー側ロジックと合わせるためコメントアウト）
                /*
                if (transaction.publicHolidayExFlgOfWeek && (i === 0 || i === 6)) {
                  continue; // 日曜日または土曜日はスキップ
                }
                */
                nextDate.setDate(today.getDate() + (7 * weekOffset) - todayIndex + i);
                foundNextDay = true;
                break;
              }
            }
            weekOffset++;
            if (weekOffset > 4) break; // 無限ループ防止
          }
        }
        break;
        
      case 'monthly':
        const dateOfMonth = transaction.dateOfMonth || 1;
        if (dateOfMonth > today.getDate()) {
          nextDate = new Date(today.getFullYear(), today.getMonth() + 1, dateOfMonth);
        } else {
          nextDate = new Date(today.getFullYear(), today.getMonth(), dateOfMonth);
        }
        // 休日調整
        if (transaction.holidayDivOfMonth === 'before') {
          if (nextDate.getDay() === 0) { // 日曜日
            nextDate.setDate(nextDate.getDate() - 2);
          } else if (nextDate.getDay() === 6) { // 土曜日
            nextDate.setDate(nextDate.getDate() - 1);
          }
        } else if (transaction.holidayDivOfMonth === 'after') {
          if (nextDate.getDay() === 0) { // 日曜日
            nextDate.setDate(nextDate.getDate() + 1);
          } else if (nextDate.getDay() === 6) { // 土曜日
            nextDate.setDate(nextDate.getDate() + 2);
          }
        }
        break;
        
      case 'yearly':
        if (transaction.dateOfYear) {
          const [month, day] = transaction.dateOfYear.split('-').map(Number);
          nextDate = new Date(today.getFullYear() + 1, month - 1, day);
          
          // 休日調整
          if (transaction.holidayDivOfMonth === 'before') {
            if (nextDate.getDay() === 0) { // 日曜日
              nextDate.setDate(nextDate.getDate() - 2);
            } else if (nextDate.getDay() === 6) { // 土曜日
              nextDate.setDate(nextDate.getDate() - 1);
            }
          } else if (transaction.holidayDivOfMonth === 'after') {
            if (nextDate.getDay() === 0) { // 日曜日
              nextDate.setDate(nextDate.getDate() + 1);
            } else if (nextDate.getDay() === 6) { // 土曜日
              nextDate.setDate(nextDate.getDate() + 2);
            }
          }
        }
        break;
        
      case 'free':
        // 適宜実行は次回実行日を計算しない
        return undefined;
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
  const handleDelete = async (transaction: RecurringTransaction) => {
    if (window.confirm('この定期取引を削除しますか？')) {
      try {
        await deleteRegularJournalEntry(transaction);
      } catch (error) {
        console.error('定期取引の削除に失敗しました:', error);
        alert('削除に失敗しました');
      }
    }
  };

  // 実行
  const executeTransaction = async (transaction: RecurringTransaction) => {
    try {
      await executeRegularJournalEntry(transaction);
      alert('定期取引を実行しました');
    } catch (error) {
      console.error('定期取引の実行に失敗しました:', error);
      alert('定期取引の実行に失敗しました');
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
            cursor: 'pointer',
            marginRight: '10px'
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
                        onClick={() => handleDelete(transaction)}
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
                  onChange={(e) => setFormData({ ...formData, holidayDivOfMonth: e.target.value as 'before' | 'after' | 'none' })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="none">なし</option>
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
