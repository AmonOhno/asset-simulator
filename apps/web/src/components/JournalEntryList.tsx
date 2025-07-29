import React, { useEffect, useState } from 'react';
import { useFinancialStore } from '../shared';
import { JournalEntry } from '../shared';

export const JournalEntryList: React.FC = () => {
  const { journalEntries, journalAccounts, updateJournalEntry, fetchData } = useFinancialStore();
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="card-header">仕訳帳</div>
      <div className="card-body">
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
            {journalEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center">仕訳データがありません。</td>
              </tr>
            ) : (
              journalEntries.map((entry) => (
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