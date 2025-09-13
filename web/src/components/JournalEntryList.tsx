import React, { useEffect, useState } from 'react';
import { useFinancialStore } from '@asset-simulator/shared';
import { JournalEntry } from '@asset-simulator/shared';
import { DateRangePicker, DateRange } from './DateRangePicker';

export const JournalEntryList: React.FC = () => {
  const { journalEntries, journalAccounts, updateJournalEntry, fetchData } = useFinancialStore();
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 期間フィルタの状態
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const defaultStartDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const defaultEndDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: defaultStartDate,
    endDate: defaultEndDate
  });

  // 勘定科目フィルタの状態
  const [debitAccountFilter, setDebitAccountFilter] = useState<string>('');
  const [creditAccountFilter, setCreditAccountFilter] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>('AND'); // フィルタモード

  // フィルタリングされた仕訳エントリ
  const filteredEntries = journalEntries.filter(entry => {
    // 期間フィルタ
    const dateMatch = entry.date >= dateRange.startDate && entry.date <= dateRange.endDate;
    
    // 勘定科目フィルタ
    if (!debitAccountFilter && !creditAccountFilter) {
      return dateMatch; // 勘定科目フィルタなしの場合
    }
    
    const debitMatch = !debitAccountFilter || entry.debitAccountId === debitAccountFilter;
    const creditMatch = !creditAccountFilter || entry.creditAccountId === creditAccountFilter;
    
    let accountMatch: boolean;
    if (filterMode === 'AND') {
      // AND条件：両方の条件を満たす
      accountMatch = debitMatch && creditMatch;
    } else {
      // OR条件：どちらかの条件を満たす（両方が設定されている場合）
      if (debitAccountFilter && creditAccountFilter) {
        accountMatch = entry.debitAccountId === debitAccountFilter || entry.creditAccountId === creditAccountFilter;
      } else {
        accountMatch = debitMatch && creditMatch;
      }
    }
    
    return dateMatch && accountMatch;
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 勘定科目名を取得する関数
  const getAccountName = (accountId: string) => {
    const account = journalAccounts.find(acc => acc.id === accountId);
    return account?.name || '不明';
  };

  // 編集開始
  const handleEditClick = (entry: JournalEntry) => {
    setEditingEntry({ ...entry });
    setIsModalOpen(true);
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setEditingEntry(null);
    setIsModalOpen(false);
  };

  // 編集保存
  const handleSaveEdit = async () => {
    if (editingEntry) {
      await updateJournalEntry(editingEntry);
      setEditingEntry(null);
      setIsModalOpen(false);
    }
  };

  // フォーム入力変更
  const handleInputChange = (field: keyof JournalEntry, value: string | number) => {
    if (editingEntry) {
      setEditingEntry({
        ...editingEntry,
        [field]: value,
      });
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <span>仕訳帳</span>
          <div className="text-end">
            <small className="text-muted">
              {filteredEntries.length} / {journalEntries.length} 件
            </small>
            {(debitAccountFilter || creditAccountFilter) && (
              <div className="mt-1">
                {debitAccountFilter && (
                  <span className="badge bg-primary me-1">
                    借方: {getAccountName(debitAccountFilter)}
                  </span>
                )}
                {(debitAccountFilter && creditAccountFilter) && (
                  <span className="badge bg-secondary me-1">
                    {filterMode}
                  </span>
                )}
                {creditAccountFilter && (
                  <span className="badge bg-success">
                    貸方: {getAccountName(creditAccountFilter)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="card-body">
        {/* フィルタ設定 */}
        <div className="mb-3">
          <div className="row">
            <div className="col-12 mb-3">
              <label className="form-label">期間</label>
              <DateRangePicker 
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-2">
              <label className="form-label">借方勘定科目</label>
              <select
                className="form-select form-select-sm"
                value={debitAccountFilter}
                onChange={(e) => setDebitAccountFilter(e.target.value)}
              >
                <option value="">すべて</option>
                {journalAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-2">
              <label className="form-label">貸方勘定科目</label>
              <select
                className="form-select form-select-sm"
                value={creditAccountFilter}
                onChange={(e) => setCreditAccountFilter(e.target.value)}
              >
                <option value="">すべて</option>
                {journalAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-2 d-flex align-items-end">
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => {
                    setDebitAccountFilter('');
                    setCreditAccountFilter('');
                  }}
                >
                  フィルタクリア
                </button>
                {(debitAccountFilter && creditAccountFilter) && (
                  <div className="btn-group" role="group">
                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="filterMode" 
                      id="filterAnd" 
                      checked={filterMode === 'AND'}
                      onChange={() => setFilterMode('AND')}
                    />
                    <label className="btn btn-outline-info btn-sm" htmlFor="filterAnd">AND</label>
                    
                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="filterMode" 
                      id="filterOr" 
                      checked={filterMode === 'OR'}
                      onChange={() => setFilterMode('OR')}
                    />
                    <label className="btn btn-outline-info btn-sm" htmlFor="filterOr">OR</label>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* クイックフィルタ */}
          <div className="row">
            <div className="col-12">
              <small className="text-muted">クイックフィルタ:</small>
              <div className="d-flex gap-1 flex-wrap mt-1">
                {journalAccounts
                  .filter(account => account.category === 'Asset' || account.category === 'Expense')
                  .slice(0, 6)
                  .map(account => (
                    <button
                      key={account.id}
                      className={`btn btn-sm ${
                        debitAccountFilter === account.id || creditAccountFilter === account.id 
                          ? 'btn-primary' 
                          : 'btn-outline-primary'
                      }`}
                      onClick={() => {
                        if (debitAccountFilter === account.id || creditAccountFilter === account.id) {
                          // 既に選択されている場合はクリア
                          setDebitAccountFilter('');
                          setCreditAccountFilter('');
                        } else {
                          // 資産・費用科目の場合は借方に設定
                          if (account.category === 'Asset' || account.category === 'Expense') {
                            setDebitAccountFilter(account.id);
                            setCreditAccountFilter('');
                          } else {
                            setCreditAccountFilter(account.id);
                            setDebitAccountFilter('');
                          }
                        }
                      }}
                    >
                      {account.name}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
        
        <table className="table table-striped">
          <thead>
            <tr>
              <th>日付</th>
              <th>摘要</th>
              <th>借方</th>
              <th>貸方</th>
              <th className="text-end">金額</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">指定期間内の仕訳がありません。</td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.description}</td>
                  <td>{getAccountName(entry.debitAccountId)}</td>
                  <td>{getAccountName(entry.creditAccountId)}</td>
                  <td className="text-end">{entry.amount.toLocaleString()}円</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleEditClick(entry)}
                    >
                      編集
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 編集モーダル */}
      {isModalOpen && editingEntry && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">仕訳編集</h5>
                <button type="button" className="btn-close" onClick={handleCancelEdit}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">日付</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editingEntry.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">摘要</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingEntry.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">借方勘定</label>
                  <select
                    className="form-select"
                    value={editingEntry.debitAccountId}
                    onChange={(e) => handleInputChange('debitAccountId', e.target.value)}
                  >
                    {journalAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">貸方勘定</label>
                  <select
                    className="form-select"
                    value={editingEntry.creditAccountId}
                    onChange={(e) => handleInputChange('creditAccountId', e.target.value)}
                  >
                    {journalAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">金額</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editingEntry.amount}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  キャンセル
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};