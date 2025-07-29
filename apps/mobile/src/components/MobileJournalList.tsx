import React from 'react';
import { useFinancialStore } from '../shared/stores/financialStore';

const MobileJournalList: React.FC = () => {
  const { journalEntries, accounts } = useFinancialStore();

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : '不明な勘定';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="mobile-journal-list">
      <div className="mobile-card">
        <h2 className="mobile-title">仕訳履歴</h2>
        {journalEntries.length === 0 ? (
          <div className="mobile-empty-state">
            <p>まだ仕訳が登録されていません</p>
          </div>
        ) : (
          <div className="mobile-entries">
            {journalEntries.map((entry) => (
              <div key={entry.id} className="mobile-entry-card">
                <div className="mobile-entry-header">
                  <span className="mobile-entry-date">
                    {formatDate(entry.date)}
                  </span>
                  <span className="mobile-entry-amount">
                    {formatAmount(entry.amount)}
                  </span>
                </div>
                <div className="mobile-entry-accounts">
                  <div className="mobile-entry-debit">
                    <span className="mobile-entry-label">借方:</span>
                    <span className="mobile-entry-account">
                      {getAccountName(entry.debitAccountId)}
                    </span>
                  </div>
                  <div className="mobile-entry-credit">
                    <span className="mobile-entry-label">貸方:</span>
                    <span className="mobile-entry-account">
                      {getAccountName(entry.creditAccountId)}
                    </span>
                  </div>
                </div>
                {entry.description && (
                  <div className="mobile-entry-description">
                    {entry.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileJournalList;
