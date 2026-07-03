import React from 'react';
import type { JournalAccount, RecurrenceFrequency, RecurringTransaction } from '@asset-simulator/shared';

interface RecurringTransactionFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: Partial<RecurringTransaction>;
  journalAccounts: JournalAccount[];
  onChange: (next: Partial<RecurringTransaction>) => void;
  onSave: () => void;
  onClose: () => void;
}

export const RecurringTransactionFormModal: React.FC<RecurringTransactionFormModalProps> = ({
  isOpen,
  isEditing,
  formData,
  journalAccounts,
  onChange,
  onSave,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
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
        <h3>{isEditing ? '定期取引編集' : '新規定期取引'}</h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            取引名 *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
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
            onChange={(e) => onChange({ ...formData, description: e.target.value })}
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
            onChange={(e) => onChange({ ...formData, debitAccountId: e.target.value })}
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
            onChange={(e) => onChange({ ...formData, creditAccountId: e.target.value })}
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
            onChange={(e) => onChange({
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
            onChange={(e) => onChange({ ...formData, startDate: e.target.value })}
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
            onChange={(e) => onChange({ ...formData, endDate: e.target.value })}
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
            onChange={(e) => onChange({
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
              onChange={(e) => onChange({
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
              onChange={(e) => onChange({ ...formData, holidayDivOfMonth: e.target.value as 'before' | 'after' | 'none' })}
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
                  onChange={(e) => onChange({ ...formData, monFlgOfWeek: e.target.checked })}
                /> 月
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.tueFlgOfWeek || false}
                  onChange={(e) => onChange({ ...formData, tueFlgOfWeek: e.target.checked })}
                /> 火
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.wedFlgOfWeek || false}
                  onChange={(e) => onChange({ ...formData, wedFlgOfWeek: e.target.checked })}
                /> 水
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.thuFlgOfWeek || false}
                  onChange={(e) => onChange({ ...formData, thuFlgOfWeek: e.target.checked })}
                /> 木
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.friFlgOfWeek || false}
                  onChange={(e) => onChange({ ...formData, friFlgOfWeek: e.target.checked })}
                /> 金
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.satFlgOfWeek || false}
                  onChange={(e) => onChange({ ...formData, satFlgOfWeek: e.target.checked })}
                /> 土
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.sunFlgOfWeek || false}
                  onChange={(e) => onChange({ ...formData, sunFlgOfWeek: e.target.checked })}
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
              onChange={(e) => onChange({ ...formData, dateOfYear: e.target.value })}
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
            onClick={onSave}
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
            onClick={onClose}
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
  );
};

export default RecurringTransactionFormModal;
