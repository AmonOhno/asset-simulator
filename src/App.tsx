// src/App.tsx

import React, { useState, useEffect } from 'react';
import { AccountManager } from './components/AccountManager';
import { CreditCardManager } from './components/CreditCardManager';

import { JournalAccountManager } from './components/JournalAccountManager';
import { JournalEntryForm } from './components/JournalEntryForm';
import { JournalEntryList } from './components/JournalEntryList';
import { BalanceSheetDisplay } from './components/BalanceSheetDisplay';
import { ProfitAndLossDisplay } from './components/ProfitAndLossDisplay';

import { useFinancialStore } from './stores/financialStore';

type Tab = 'dashboard' | 'transactions' | 'masters';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('masters');
  const fetchData = useFinancialStore((state) => state.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderContent = () => {
    switch (activeTab) {
      case 'transactions':
        return (
          <div className="row">
            <div className="col-lg-5">
              <JournalEntryForm />
            </div>
            <div className="col-lg-7">
              <JournalEntryList />
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="row">
            <div className="col-lg-6 mb-4">
              <BalanceSheetDisplay />
            </div>
            <div className="col-lg-6 mb-4">
              <ProfitAndLossDisplay />
            </div>
          </div>
        );
      case 'masters':
        return (
          <div className="row">
            <div className="col-lg-4 mb-4">
              <AccountManager />
            </div>
            <div className="col-lg-4 mb-4">
              <CreditCardManager />
            </div>
            <div className="col-lg-4 mb-4">
              <JournalAccountManager />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container-fluid p-4">
      <header className="mb-4">
        <h1 className="display-6">会計＆資産シミュレーター</h1>
      </header>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'masters' ? 'active' : ''}`} onClick={() => setActiveTab('masters')}>マスタ管理</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>取引入力</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>ダッシュボード</button>
        </li>
      </ul>

      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;