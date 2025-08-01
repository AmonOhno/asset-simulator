import React, { useEffect, useState } from 'react';
import Calendar, { TileArgs } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useFinancialStore } from '@asset-simulator/shared';
import type { JournalEntry } from '@asset-simulator/shared';

// カスタムCSS用のインターface
type CalendarTileProps = TileArgs;

export const JournalCalendar: React.FC = () => {
  const { journalEntries, journalAccounts, fetchData } = useFinancialStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateEntries, setSelectedDateEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 日付を文字列形式に変換（YYYY-MM-DD）- 時差問題を回避
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 指定した日付の仕訳データを取得
  const getEntriesForDate = (date: Date): JournalEntry[] => {
    const dateString = formatDateToString(date);
    return journalEntries.filter(entry => entry.date === dateString);
  };

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
    }
  };

  // カレンダーのタイルにカスタム内容を表示
  const tileContent = ({ date, view }: CalendarTileProps) => {
    if (view === 'month') {
      const entries = getEntriesForDate(date);
      const { expenses, revenues } = calculateDayFinancials(date);
      
      if (entries.length > 0) {
        return (
          <div className="journal-tile-indicator">
            <div className="entry-count">{entries.length}</div>
            <div className="entry-amount">
              {expenses > revenues ? `支出${(expenses / 1000).toFixed(0)}k` : `収益${(revenues / 1000).toFixed(0)}k`}
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
      if (entries.length > 0) {
        const { expenses, revenues } = calculateDayFinancials(date);
        if (expenses > revenues) {
          return 'has-entries expense-dominant';
        } else if (revenues > expenses) {
          return 'has-entries revenue-dominant';
        } else {
          return 'has-entries balanced';
        }
      }
    }
    return '';
  };

  return (
    <div className="journal-calendar-mobile">
      <style>{`
        .journal-calendar-mobile {
          padding: 16px;
          max-width: 100%;
          overflow-x: hidden;
        }
        
        .mobile-calendar-header {
          margin-bottom: 16px;
          text-align: center;
        }
        
        .mobile-calendar-header h2 {
          font-size: 1.3em;
          margin-bottom: 8px;
          color: #333;
        }
        
        .mobile-calendar-header p {
          font-size: 0.9em;
          color: #666;
          margin: 0;
        }
        
        .react-calendar {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          font-size: 1em;
        }
        
        .react-calendar__navigation {
          height: 54px;
          margin-bottom: 0.5em;
        }
        
        .react-calendar__navigation__label {
          font-size: 1.1em;
          font-weight: bold;
        }
        
        .react-calendar__navigation__arrow {
          font-size: 1.1em;
        }
        
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.8em;
          padding: 8px 0;
        }
        
        .react-calendar__tile {
          height: 65px;
          position: relative;
          padding: 4px;
          font-size: 0.9em;
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
          border: 1px solid #2196f3;
        }
        
        .react-calendar__tile.revenue-dominant {
          background-color: #ffebee !important;
          border: 1px solid #f44336;
        }
        
        .react-calendar__tile.balanced {
          background-color: #f3e5f5 !important;
          border: 1px solid #9c27b0;
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
        
        .journal-tile-indicator {
          font-size: 9px;
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          text-align: center;
        }
        
        .entry-count {
          background-color: #2196f3;
          color: white;
          border-radius: 50%;
          width: 14px;
          height: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          margin-bottom: 1px;
        }
        
        .entry-amount {
          color: #1976d2;
          font-weight: bold;
          font-size: 8px;
        }
        
        .mobile-selected-date {
          margin-top: 20px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 16px;
        }
        
        .mobile-selected-date-header {
          font-size: 1.1em;
          font-weight: bold;
          margin-bottom: 12px;
          color: #495057;
          text-align: center;
        }
        
        .mobile-journal-entry {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .mobile-journal-entry.expense {
          border-left: 3px solid #2196f3;
          background: #f8fbff;
        }
        
        .mobile-journal-entry.revenue {
          border-left: 3px solid #f44336;
          background: #fffbfb;
        }
        
        .mobile-entry-description {
          font-weight: bold;
          color: #495057;
          margin-bottom: 6px;
          font-size: 0.95em;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        
        .mobile-type-badge {
          font-size: 0.6em;
          padding: 1px 4px;
          border-radius: 2px;
          color: white;
          font-weight: normal;
        }
        
        .mobile-type-badge.expense {
          background-color: #2196f3;
        }
        
        .mobile-type-badge.revenue {
          background-color: #f44336;
        }
        
        .mobile-financial-summary {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
          font-size: 0.9em;
        }
        
        .mobile-summary-item {
          margin-bottom: 4px;
          text-align: center;
        }
        
        .mobile-summary-item:last-child {
          margin-bottom: 0;
          padding-top: 4px;
          border-top: 1px solid #dee2e6;
          font-weight: bold;
        }
        
        .mobile-summary-item.expense span {
          color: #2196f3;
        }
        
        .mobile-summary-item.revenue span {
          color: #f44336;
        }
        
        .mobile-summary-item .positive {
          color: #28a745;
        }
        
        .mobile-summary-item .negative {
          color: #dc3545;
        }
        
        .mobile-entry-accounts {
          font-size: 0.85em;
          margin-bottom: 6px;
          line-height: 1.3;
        }
        
        .mobile-entry-debit {
          color: #dc3545;
          display: block;
          margin-bottom: 2px;
        }
        
        .mobile-entry-credit {
          color: #28a745;
          display: block;
        }
        
        .mobile-entry-amount {
          font-size: 1em;
          font-weight: bold;
          text-align: right;
          color: #495057;
        }
        
        .mobile-no-entries {
          text-align: center;
          color: #6c757d;
          font-style: italic;
          padding: 20px;
          font-size: 0.9em;
        }
        
        .mobile-daily-summary {
          background: #e9ecef;
          padding: 10px;
          border-radius: 4px;
          text-align: center;
          font-weight: bold;
          margin-top: 8px;
          font-size: 0.95em;
        }
      `}</style>
      
      <div className="mobile-calendar-header">
        <h2>📅 仕訳カレンダー</h2>
        <p>日付をタップしてその日の仕訳を確認</p>
      </div>
      
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName}
        locale="ja-JP"
      />
      
      <div className="mobile-selected-date">
        <div className="mobile-selected-date-header">
          {selectedDate.toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          })} の仕訳
        </div>
        
        {selectedDateEntries.length === 0 ? (
          <div className="mobile-no-entries">
            この日は仕訳データがありません
          </div>
        ) : (
          <div className="mobile-entries-list">
            {/* 費用・収益サマリー */}
            {(() => {
              const { expenses, revenues } = calculateDayFinancials(selectedDate);
              if (expenses > 0 || revenues > 0) {
                return (
                  <div className="mobile-financial-summary">
                    {expenses > 0 && (
                      <div className="mobile-summary-item expense">
                        <span>費用: ¥{expenses.toLocaleString()}</span>
                      </div>
                    )}
                    {revenues > 0 && (
                      <div className="mobile-summary-item revenue">
                        <span>収益: ¥{revenues.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="mobile-summary-item net">
                      <span className={revenues - expenses >= 0 ? 'positive' : 'negative'}>
                        純損益: ¥{(revenues - expenses).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {selectedDateEntries.map((entry) => {
              const debitCategory = getAccountCategory(entry.debitAccountId);
              const creditCategory = getAccountCategory(entry.creditAccountId);
              const isExpenseEntry = debitCategory === 'Expense' || creditCategory === 'Expense';
              const isRevenueEntry = debitCategory === 'Revenue' || creditCategory === 'Revenue';
              
              return (
                <div key={entry.id} className={`mobile-journal-entry ${isExpenseEntry ? 'expense' : ''} ${isRevenueEntry ? 'revenue' : ''}`}>
                  <div className="mobile-entry-description">
                    {entry.description}
                    {isExpenseEntry && <span className="mobile-type-badge expense">費用</span>}
                    {isRevenueEntry && <span className="mobile-type-badge revenue">収益</span>}
                  </div>
                  <div className="mobile-entry-accounts">
                    <span className="mobile-entry-debit">
                      借方: {getAccountName(entry.debitAccountId)}
                    </span>
                    <span className="mobile-entry-credit">
                      貸方: {getAccountName(entry.creditAccountId)}
                    </span>
                  </div>
                  <div className="mobile-entry-amount">
                    ¥{entry.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
            
            <div className="mobile-daily-summary">
              仕訳件数: {selectedDateEntries.length}件
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
