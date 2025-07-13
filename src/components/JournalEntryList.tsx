
// src/components/JournalEntryList.tsx

import React from 'react';
import { useFinancialStore } from '../stores/financialStore';

export const JournalEntryList: React.FC = () => {
  const { journalEntries, journalAccounts } = useFinancialStore();

  // IDから勘定科目名を取得するためのヘルパー関数
  const getAccountName = (id: string) => {
    const account = journalAccounts.find((acc) => acc.id === id);
    return account ? account.name : '不明';
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
            </tr>
          </thead>
          <tbody>
            {journalEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center">仕訳データがありません。</td>
              </tr>
            ) : (
              journalEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.description}</td>
                  <td>{getAccountName(entry.debitAccountId)}</td>
                  <td>{getAccountName(entry.creditAccountId)}</td>
                  <td className="text-end">{entry.amount.toLocaleString()}円</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
