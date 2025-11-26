import React, { useEffect, useState, useCallback } from 'react';
import Calendar, { TileArgs } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useFinancialStore, useEventsStore } from '@asset-simulator/shared';
import type { JournalEntry, ScheduleEvent } from '@asset-simulator/shared';
import { JournalEntriesModal } from './JournalEntriesModal';

type CalendarTileProps = TileArgs;

export const JournalCalendar: React.FC = () => {
  const { journalEntries, journalAccounts, updateJournalEntry } = useFinancialStore();
  const { events } = useEventsStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateEntries, setSelectedDateEntries] = useState<JournalEntry[]>([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState<ScheduleEvent[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 勘定科目フィルタ
  const [debitAccountFilter, setDebitAccountFilter] = useState<string>('');
  const [creditAccountFilter, setCreditAccountFilter] = useState<string>('');

  // 日付を文字列形式に変換（YYYY-MM-DD）
  const formatDateToString = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

// データ取得は App.tsx で一元管理されるため、useEffect を削除

// --- useCallbackで関数を安定化 ---
const getEntriesForDate = useCallback(
  (date: Date): JournalEntry[] => {
    const dateString = formatDateToString(date);
    return journalEntries
      .filter((entry) => entry.date === dateString)
      .filter((entry) => {
        // 借方勘定科目フィルタ
        if (debitAccountFilter && entry.debitAccountId !== debitAccountFilter) {
          return false;
        }
        // 貸方勘定科目フィルタ
        if (creditAccountFilter && entry.creditAccountId !== creditAccountFilter) {
          return false;
        }
        return true;
      });
  },
  [journalEntries, formatDateToString, debitAccountFilter, creditAccountFilter] // journalEntries が変わったときだけ再生成
);

const getEventsForDate = useCallback(
  (date: Date): ScheduleEvent[] => {
    const dateString = formatDateToString(date);
    return events.filter((event) => event.startDate === dateString);
  },
  [events, formatDateToString] // events が変わったときだけ再生成
);

// 選択日が変わったら、その日の仕訳/イベントを更新
useEffect(() => {
  const entries = getEntriesForDate(selectedDate);
  setSelectedDateEntries(entries);

  const eventsForDate = getEventsForDate(selectedDate);
  setSelectedDateEvents(eventsForDate);
}, [selectedDate, getEntriesForDate, getEventsForDate]);

// フィルタが変更されたら、選択日の仕訳を更新
useEffect(() => {
  const entries = getEntriesForDate(selectedDate);
  setSelectedDateEntries(entries);
}, [debitAccountFilter, creditAccountFilter, getEntriesForDate, selectedDate]);

// 勘定科目名を取得する関数
  const getAccountName = (accountId: string): string => {
    const account = journalAccounts.find(acc => acc.id === accountId);
    return account?.name || '不明';
  };

  // 勘定科目のカテゴリを取得する関数
  const getAccountCategory = (accountId: string): string => {
    const account = journalAccounts.find(acc => acc.id === accountId);
    return account?.category || '';
  };

  // 指定した日付の費用・収益を計算
  const calculateDayFinancials = (date: Date) => {
    const entries = getEntriesForDate(date);
    let expenses = 0;
    let revenues = 0;

    entries.forEach(entry => {
      const debitCategory = getAccountCategory(entry.debitAccountId);
      const creditCategory = getAccountCategory(entry.creditAccountId);

      // 借方が費用科目の場合、費用が増加
      if (debitCategory === 'Expense') {
        expenses += entry.amount;
      }
      // 貸方が費用科目の場合、費用が減少
      if (creditCategory === 'Expense') {
        expenses -= entry.amount;
      }
      // 借方が収益科目の場合、収益が減少
      if (debitCategory === 'Revenue') {
        revenues -= entry.amount;
      }
      // 貸方が収益科目の場合、収益が増加
      if (creditCategory === 'Revenue') {
        revenues += entry.amount;
      }
    });

    return { expenses, revenues };
  };

  // 日付が選択された時の処理
  const handleDateChange = (value: any) => {
    if (value && value instanceof Date) {
      setSelectedDate(value);
      const entries = getEntriesForDate(value);
      setSelectedDateEntries(entries);
      const events = getEventsForDate(value);
      setSelectedDateEvents(events);
    }
  };

    // 編集モーダル関連
    const handleEditEntry = (entry: JournalEntry) => {
      setEditingEntry({ ...entry });
      setIsModalOpen(true);
    };

    const handleCancelEdit = () => {
      setEditingEntry(null);
      setIsModalOpen(false);
    };

    const handleSaveEdit = async () => {
      if (editingEntry) {
        await updateJournalEntry(editingEntry);
        setEditingEntry(null);
        setIsModalOpen(false);
      }
    };

    const handleModalInputChange = (field: keyof JournalEntry, value: string | number) => {
      if (editingEntry) {
        setEditingEntry({
          ...editingEntry,
          [field]: value,
        });
      }
    };

  // カレンダーのタイルにカスタム内容を表示
  const tileContent = ({ date, view }: CalendarTileProps) => {
    if (view === 'month') {
      const entries = getEntriesForDate(date);
      const events = getEventsForDate(date);
      const { expenses, revenues } = calculateDayFinancials(date);
      
      if (entries.length > 0 || events.length > 0) {
        return (
          <div className="journal-tile-indicator">
            {entries.length > 0 && <div className="entry-count">{entries.length}</div>}
            {events.length > 0 && <div className="event-count" style={{fontSize: '10px', color: '#007bff'}}>📅{events.length}</div>}
            <div className="entry-financial">
              {expenses > 0 && <div className="expense-amount">支出: ¥{expenses.toLocaleString()}</div>}
              {revenues > 0 && <div className="revenue-amount">収益: ¥{revenues.toLocaleString()}</div>}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  // タイルのクラス名を設定（費用・収益による背景色変更）
  const tileClassName = ({ date, view }: CalendarTileProps) => {
    if (view === 'month') {
      const entries = getEntriesForDate(date);
      const events = getEventsForDate(date);
      
      if (entries.length > 0 || events.length > 0) {
        let className = 'has-entries';
        
        if (entries.length > 0) {
          const { expenses, revenues } = calculateDayFinancials(date);
          if (expenses > revenues) {
            className += ' expense-dominant';
          } else if (revenues > expenses) {
            className += ' revenue-dominant';
          } else {
            className += ' balanced';
          }
        }
        
        if (events.length > 0) {
          className += ' has-events';
        }
        
        return className;
      }
    }
    return '';
  };

  return (
    <div className="journal-calendar-container">
      <style>{`
        .journal-calendar-container {
          padding: 20px;
        }
        
        .calendar-header {
          margin-bottom: 20px;
        }
        
        .account-filters {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 15px;
        }
        
        .account-filters .form-label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 5px;
        }
        
        .account-filters .form-select {
          border-radius: 4px;
          border: 1px solid #ced4da;
        }
        
        .account-filters .btn-outline-secondary {
          border-radius: 4px;
          font-weight: 500;
        }
        
        .calendar-wrapper {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
        }
        
        .calendar-section {
          flex: 2;
          min-width: 500px;
        }
        
        .entries-section {
          flex: 1;
          min-width: 350px;
        }
        
        .react-calendar {
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          width: 100%;
          max-width: none;
          font-size: 1.1em;
        }
        
        .react-calendar__navigation {
          height: 60px;
          margin-bottom: 1em;
        }
        
        .react-calendar__navigation__label {
          font-size: 1.3em;
          font-weight: bold;
        }
        
        .react-calendar__navigation__arrow {
          font-size: 1.2em;
        }
        
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.9em;
          padding: 10px 0;
        }
        
        .react-calendar__tile {
          height: 80px;
          position: relative;
          padding: 8px;
          font-size: 1em;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        
        .react-calendar__tile.has-entries {
          border-radius: 4px;
        }
        
        .react-calendar__tile.expense-dominant {
          background-color: #e3f2fd !important;
          border: 2px solid #2196f3;
        }
        
        .react-calendar__tile.revenue-dominant {
          background-color: #ffebee !important;
          border: 2px solid #f44336;
        }
        
        .react-calendar__tile.balanced {
          background-color: #f3e5f5 !important;
          border: 2px solid #9c27b0;
        }
        
        .react-calendar__tile.expense-dominant:hover {
          background-color: #bbdefb !important;
        }
        
        .react-calendar__tile.revenue-dominant:hover {
          background-color: #ffcdd2 !important;
        }
        
        .react-calendar__tile.balanced:hover {
          background-color: #e1bee7 !important;
        }
        
        .react-calendar__tile.has-events {
          border-left: 3px solid #007bff;
        }
        
        .react-calendar__tile.has-events.has-entries {
          border-left: 3px solid #007bff;
          border-right: 3px solid #007bff;
        }
        
        .journal-tile-indicator {
          font-size: 10px;
          margin-top: 4px;
          text-align: center;
          width: 100%;
        }
        
        .entry-count {
          background-color: #333;
          color: white;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 3px;
          font-size: 9px;
        }
        
        .entry-financial {
          line-height: 1.1;
        }
        
        .expense-amount {
          color: #1976d2;
          font-weight: bold;
          font-size: 9px;
          margin-bottom: 1px;
        }
        
        .revenue-amount {
          color: #d32f2f;
          font-weight: bold;
          font-size: 9px;
        }
        
        .selected-date-section {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
        }
        
        .selected-date-header {
          font-size: 1.2em;
          font-weight: bold;
          margin-bottom: 15px;
          color: #495057;
        }
        
        .journal-entry-item {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .journal-entry-item.expense-entry {
          border-left: 4px solid #2196f3;
          background: #f8fbff;
        }
        
        .journal-entry-item.revenue-entry {
          border-left: 4px solid #f44336;
          background: #fffbfb;
        }
        
        .entry-description {
          font-weight: bold;
          color: #495057;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .entry-type-badge {
          font-size: 0.7em;
          padding: 2px 6px;
          border-radius: 3px;
          color: white;
          font-weight: normal;
        }
        
        .entry-type-badge.expense {
          background-color: #2196f3;
        }
        
        .entry-type-badge.revenue {
          background-color: #f44336;
        }
        
        .financial-summary {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 15px;
        }
        
        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .summary-item:last-child {
          margin-bottom: 0;
          padding-top: 5px;
          border-top: 1px solid #dee2e6;
          font-weight: bold;
        }
        
        .summary-item.expense .summary-amount {
          color: #2196f3;
        }
        
        .summary-item.revenue .summary-amount {
          color: #f44336;
        }
        
        .summary-amount.positive {
          color: #28a745;
        }
        
        .summary-amount.negative {
          color: #dc3545;
        }
        
        .entry-accounts {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.9em;
        }
        
        .entry-debit {
          color: #dc3545;
        }
        
        .entry-credit {
          color: #28a745;
        }
        
        .entry-amount {
          font-size: 1.1em;
          font-weight: bold;
          text-align: right;
          color: #495057;
        }
        
        .no-entries {
          text-align: center;
          color: #6c757d;
          font-style: italic;
          padding: 20px;
        }
        
        @media (max-width: 1200px) {
          .calendar-section {
            flex: 1;
            min-width: 450px;
          }
        }
        
        @media (max-width: 768px) {
          .calendar-wrapper {
            flex-direction: column;
          }
          
          .calendar-section,
          .entries-section {
            min-width: 100%;
          }
          
          .react-calendar__tile {
            height: 60px;
            font-size: 0.9em;
          }
          
          .journal-tile-indicator {
            font-size: 8px;
          }
          
          .entry-count {
            width: 14px;
            height: 14px;
            font-size: 7px;
          }
        }
      `}</style>
      
      <div className="calendar-header">
        <h2>📅 カレンダー</h2>
        <p>カレンダーから日付を選択して、その日のスケジュール及び仕訳データを確認できます。</p>
        
        {/* 勘定科目フィルタ */}
        <div className="account-filters mt-3">
          <div className="row g-3">
            <div className="col-md-5">
              <label htmlFor="debitFilter" className="form-label">借方勘定科目フィルタ</label>
              <select
                id="debitFilter"
                className="form-select"
                value={debitAccountFilter}
                onChange={(e) => setDebitAccountFilter(e.target.value)}
              >
                <option value="">全て表示</option>
                {journalAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-5">
              <label htmlFor="creditFilter" className="form-label">貸方勘定科目フィルタ</label>
              <select
                id="creditFilter"
                className="form-select"
                value={creditAccountFilter}
                onChange={(e) => setCreditAccountFilter(e.target.value)}
              >
                <option value="">全て表示</option>
                {journalAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setDebitAccountFilter('');
                  setCreditAccountFilter('');
                }}
              >
                クリア
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="calendar-wrapper">
        <div className="calendar-section">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            tileClassName={tileClassName}
            locale="ja-JP"
          />
        </div>
        
        <div className="entries-section">
          <div className="selected-date-section">
            <div className="selected-date-header">
              {selectedDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })} 
            </div>
            
            {selectedDateEntries.length === 0 && selectedDateEvents.length === 0 ? (
              <div className="no-entries">
                この日はスケジュール／仕訳データがありません
              </div>
            ) : (
              <div className="entries-list">
                {/* イベント表示 */}
                {selectedDateEvents.length > 0 && (
                  <div className="events-section mb-3">
                    <h5 className="text-primary">📅 スケジュール ({selectedDateEvents.length}件)</h5>
                    {selectedDateEvents.map((event) => (
                      <div key={event.eventId} className="card mb-2" style={{backgroundColor: '#f8f9fa'}}>
                        <div className="card-body py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{event.title}</strong>
                              <div className="text-muted small">
                                {event.startTime} - {event.endTime}
                              </div>
                              {event.description && (
                                <div className="small">{event.description}</div>
                              )}
                            </div>
                            <div className="badge bg-primary">
                              {event.allDayFlg ? '終日' : '時間指定'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 費用・収益サマリー */}
                {(() => {
                  const { expenses, revenues } = calculateDayFinancials(selectedDate);
                  if (expenses > 0 || revenues > 0) {
                    return (
                      <div className="financial-summary">
                        {expenses > 0 && (
                          <div className="summary-item expense">
                            <span className="summary-label">費用合計:</span>
                            <span className="summary-amount">¥{expenses.toLocaleString()}</span>
                          </div>
                        )}
                        {revenues > 0 && (
                          <div className="summary-item revenue">
                            <span className="summary-label">収益合計:</span>
                            <span className="summary-amount">¥{revenues.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="summary-item net">
                          <span className="summary-label">純損益:</span>
                          <span className={`summary-amount ${revenues - expenses >= 0 ? 'positive' : 'negative'}`}>
                            ¥{(revenues - expenses).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* 仕訳詳細リスト */}
                {selectedDateEntries.map((entry) => {
                  const debitCategory = getAccountCategory(entry.debitAccountId);
                  const creditCategory = getAccountCategory(entry.creditAccountId);
                  const isExpenseEntry = debitCategory === 'Expense' || creditCategory === 'Expense';
                  const isRevenueEntry = debitCategory === 'Revenue' || creditCategory === 'Revenue';
                  
                  return (
                    <div key={entry.id} className={`journal-entry-item ${isExpenseEntry ? 'expense-entry' : ''} ${isRevenueEntry ? 'revenue-entry' : ''}`}>
                      <div className="entry-description d-flex justify-content-between align-items-start">
                        <div>
                          {entry.description}
                          {isExpenseEntry && <span className="entry-type-badge expense ms-2">費用</span>}
                          {isRevenueEntry && <span className="entry-type-badge revenue ms-2">収益</span>}
                        </div>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditEntry(entry)}
                        >
                          編集
                        </button>
                      </div>
                      <div className="entry-accounts">
                        <span className="entry-debit">
                          借方: {getAccountName(entry.debitAccountId)}
                        </span>
                        <span className="entry-credit">
                          貸方: {getAccountName(entry.creditAccountId)}
                        </span>
                      </div>
                      <div className="entry-amount">
                        ¥{entry.amount.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
                
                <div className="daily-summary">
                  <strong>
                    仕訳件数: {selectedDateEntries.length}件
                    {selectedDateEvents.length > 0 && ` / イベント: ${selectedDateEvents.length}件`}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <JournalEntriesModal
        isOpen={isModalOpen}
        entry={editingEntry}
        journalAccounts={journalAccounts}
        onCancel={handleCancelEdit}
        onSave={handleSaveEdit}
        onChange={handleModalInputChange}
      />
    </div>
  );
};
