import React from 'react';
import { JournalEntry, JournalAccount } from '@asset-simulator/shared';

interface JournalEntriesModalProps {
  isOpen: boolean;
  entry: JournalEntry | null;
  journalAccounts: JournalAccount[];
  onCancel: () => void;
  onSave: () => void;
  onChange: (field: keyof JournalEntry, value: string | number) => void;
}

export const JournalEntriesModal: React.FC<JournalEntriesModalProps> = ({
  isOpen,
  entry,
  journalAccounts,
  onCancel,
  onSave,
  onChange,
}) => {
  if (!isOpen || !entry) {
    return null;
  }

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">仕訳編集</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">日付</label>
              <input
                type="date"
                className="form-control"
                value={entry.date}
                onChange={(e) => onChange('date', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">摘要</label>
              <input
                type="text"
                className="form-control"
                value={entry.description}
                onChange={(e) => onChange('description', e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">借方勘定</label>
              <select
                className="form-select"
                value={entry.debitAccountId}
                onChange={(e) => onChange('debitAccountId', e.target.value)}
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
                value={entry.creditAccountId}
                onChange={(e) => onChange('creditAccountId', e.target.value)}
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
                value={entry.amount}
                onChange={(e) => onChange('amount', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              キャンセル
            </button>
            <button type="button" className="btn btn-primary" onClick={onSave}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
