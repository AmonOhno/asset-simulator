import React, { useEffect, useState } from 'react';
import { useFinancialStore, useAuthStore } from '@asset-simulator/shared';
import { JournalEntry } from '@asset-simulator/shared';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { JournalEntriesModal } from './JournalEntriesModal';

export const JournalEntryList: React.FC = () => {
  const { journalEntries, journalAccounts, updateJournalEntry } = useFinancialStore();
  const { userId } = useAuthStore();
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 期間フィルタの状態（前回設定を localStorage に保持）
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const defaultStartDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const defaultEndDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const getLocalStorageKey = (suffix: string) => userId ? `journalEntry-${suffix}_${userId}` : `journalEntry-${suffix}`;

  const loadInitialDateRange = (): DateRange => {
    try {
      const key = getLocalStorageKey('dateRange');
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.startDate && parsed.endDate) {
          return parsed;
        }
      }
    } catch (_) {
      // ignore parse error
    }
    return { startDate: defaultStartDate, endDate: defaultEndDate };
  };

  const loadInitialFilters = () => {
    const key = getLocalStorageKey('filters');
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (_) {
      // ignore parse error
    }
    return {
      debitAccountFilter: '',
      creditAccountFilter: '',
      filterMode: 'AND' as 'AND' | 'OR',
      descriptionFilter: ''
    };
  };

  const [dateRange, setDateRange] = useState<DateRange>(loadInitialDateRange);
  const initialFilters = loadInitialFilters();
  const [debitAccountFilter, setDebitAccountFilter] = useState<string>(initialFilters.debitAccountFilter);
  const [creditAccountFilter, setCreditAccountFilter] = useState<string>(initialFilters.creditAccountFilter);
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>(initialFilters.filterMode);
  const [descriptionFilter, setDescriptionFilter] = useState<string>(initialFilters.descriptionFilter);

  // 日付範囲変更時に保存
  useEffect(() => {
    try {
      const key = getLocalStorageKey('dateRange');
      localStorage.setItem(key, JSON.stringify(dateRange));
    } catch (_) {
      // 保存失敗時は無視
    }
  },);

  // フィルタ変更時に保存
  useEffect(() => {
    try {
      const key = getLocalStorageKey('filters');
      const filters = {
        debitAccountFilter,
        creditAccountFilter,
        filterMode,
        descriptionFilter
      };
      localStorage.setItem(key, JSON.stringify(filters));
    } catch (_) {
      // 保存失敗時は無視
    }
  }, );

  // フィルタリングされた仕訳エントリ
  const filteredEntries = journalEntries.filter(entry => {
    // 期間フィルタ
    const dateMatch = entry.date >= dateRange.startDate && entry.date <= dateRange.endDate;
    // 摘要フィルタ（部分一致・大文字小文字区別なし）
    const descriptionMatch = !descriptionFilter || entry.description.toLowerCase().includes(descriptionFilter.toLowerCase());
    
    // 勘定科目フィルタ
    let accountMatch = true;
    if (debitAccountFilter || creditAccountFilter) {
      const debitMatch = !debitAccountFilter || entry.debitAccountId === debitAccountFilter;
      const creditMatch = !creditAccountFilter || entry.creditAccountId === creditAccountFilter;
    
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
    }
    
    return dateMatch && accountMatch && descriptionMatch;
  });

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

  // CSV出力
  const handleExportCSV = () => {
    // Package側のCSV生成ロジック呼び出し
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
    <div className="card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <span>仕訳帳</span>
          <div className="row text-end">
            {/* 件数 */}
            <small className="text-muted">
              {filteredEntries.length} / {journalEntries.length} 件
            </small>
            {/* CSV */}
              <div className="col-2 mb-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm btn-icon-borderless custom-radius"
                onClick={handleExportCSV}
                aria-label="CSV出力"
              >
                <img
                  src="/assets/icons/download-icon.svg"
                  alt=""
                  style={{ width: 18, height: 20 }}
                />
              </button>
            </div>
            {/* フィルタ条件 */}
            {(debitAccountFilter || creditAccountFilter || descriptionFilter) && (
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
                {descriptionFilter && (
                  <span className="badge bg-info ms-1">
                    摘要: {descriptionFilter}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="card-body card-body-scrollable">
          {/* フィルタ設定 */}
          <div className="col-10 mb-5">
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
              <div className="col-md-4 mb-2">
                <label className="form-label">摘要（部分一致）</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={descriptionFilter}
                  placeholder="例: 家賃"
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                />
              </div>
              <div className="col-md-4 mt-2 d-flex align-items-end">
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-secondary btn-sm custom-radius"
                    onClick={() => {
                      setDebitAccountFilter('');
                      setCreditAccountFilter('');
                      setDescriptionFilter('');
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
          </div>
        {/* データリスト */}
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
        {/* 編集画面 */}
        <JournalEntriesModal
          isOpen={isModalOpen}
          entry={editingEntry}
          journalAccounts={journalAccounts}
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
};