// src/App.tsx

import React, { useState, useEffect } from 'react';
import './App.css';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from './supabaseClient';
import { useAuthStore } from '@asset-simulator/shared';

import { AccountManager } from './components/journal/AccountManager';
import { CreditCardManager } from './components/journal/CreditCardManager';
import { JournalAccountManager } from './components/journal/JournalAccountManager';
import { JournalEntryForm } from './components/journal/JournalEntryForm';
import { JournalEntryList } from './components/journal/JournalEntryList';
import { JournalCalendar } from './components/journal/JournalCalendar';
import { Dashboard } from './components/journal/Dashboard';
import { RecurringTransactionManager } from './components/journal/RecurringTransactionManager';
import { useFinancialStore } from '@asset-simulator/shared';

import { EventScheduleForm } from './components/event/EventScheduleForm';
import { EventScheduleManager } from './components/event/EventScheduleManager';
import { useEventsStore } from '@asset-simulator/shared';


type Tab = 'dashboard' | 'transactions' | 'calendar' | 'masters' | 'recurring' | 'events';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('transactions');
  const fetchFinancial = useFinancialStore((state) => state.fetchFinancial);
  const fetchEvents = useEventsStore((state) => state.fetchEvents);
  const { session, setSession } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  useEffect(() => {
    if (session) {
      fetchEvents();
    }
  }, [session, fetchEvents]);

  useEffect(() => {
    if (session) {
      fetchFinancial();
    }
  }, [session, fetchFinancial]);

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
      case 'calendar':
        return (
          <div className="row">
            <div className="col-12">
              <JournalCalendar />
            </div>
          </div>
        );
      case 'dashboard':
        return <Dashboard />;
      case 'recurring':
        return <RecurringTransactionManager />;
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
      case 'events':
        return (
          <div className="row">
            <div className="col-lg-4">
              <EventScheduleForm />
            </div>
            <div className="col-lg-8">
              <EventScheduleManager />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!session) {
    return (
      <div className="container" style={{ paddingTop: '100px' }}>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google', 'github']}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <header className="mb-4">
        <h1 className="display-6">会計＆資産シミュレーター</h1>
      </header>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>取引入力</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>カレンダー</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>ダッシュボード</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'recurring' ? 'active' : ''}`} onClick={() => setActiveTab('recurring')}>定期取引</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'masters' ? 'active' : ''}`} onClick={() => setActiveTab('masters')}>マスタ管理</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>イベント</button>
        </li>
      </ul>

      <main>
        {renderContent()}
      </main>

      <footer className="mt-4 text-center text-muted">
        <button
          onClick={async () => {
            try {
              await supabase.auth.signOut();
              setSession(null);
            } catch (err) {
              console.error('Sign out failed:', err);
            }
          }}
          className="btn btn-outline-secondary"
        >
          ログアウト
        </button>
      </footer>
    </div>
  );
}

export default App;