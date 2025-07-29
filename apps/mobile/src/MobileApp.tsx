import React, { useState, useEffect } from 'react';
import MobileJournalEntry from './components/MobileJournalEntry';
import MobileJournalList from './components/MobileJournalList';
import { useFinancialStore } from './shared/stores/financialStore';
import './mobile.css';

const MobileApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'entry' | 'list'>('entry');
  const { fetchData } = useFinancialStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="mobile-app">
      <header className="mobile-header">
        <h1 className="mobile-app-title">会計管理</h1>
      </header>

      <nav className="mobile-nav">
        <button
          className={`mobile-nav-btn ${activeTab === 'entry' ? 'active' : ''}`}
          onClick={() => setActiveTab('entry')}
        >
          新規仕訳
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          仕訳履歴
        </button>
      </nav>

      <main className="mobile-main">
        {activeTab === 'entry' && <MobileJournalEntry />}
        {activeTab === 'list' && <MobileJournalList />}
      </main>
    </div>
  );
};

export default MobileApp;
