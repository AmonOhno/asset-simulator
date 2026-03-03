// src/App.tsx

import { useState, useEffect, useRef } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useAuthStore } from '@asset-simulator/shared';

import { AccountManager } from './components/journal/AccountManager';
import { CreditCardManager } from './components/journal/CreditCardManager';
import { JournalAccountManager } from './components/journal/JournalAccountManager';
import { JournalEntryForm } from './components/journal/JournalEntryForm';
import { JournalCalendar } from './components/journal/JournalCalendar';
import { Dashboard } from './components/journal/Dashboard';
import { RecurringTransactionManager } from './components/journal/RecurringTransactionManager';
import { useFinancialStore } from '@asset-simulator/shared';

import { EventScheduleForm } from './components/event/EventScheduleForm';
import { EventScheduleManager } from './components/event/EventScheduleManager';
import { useEventsStore } from '@asset-simulator/shared';


type Tab = 'dashboard' | 'transactions' | 'masters' | 'recurring' | 'events';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('transactions');
  const fetchFinancial = useFinancialStore((state) => state.fetchFinancial);
  const fetchEvents = useEventsStore((state) => state.fetchEvents);
  const { session, client, setSession, refreshSession, signOut } = useAuthStore();

// 認証状態の監視設定
  useEffect(() => {
    let isMounted = true;

    // 初回セッション取得
    refreshSession().then((currentSession) => {
      if (isMounted) setSession(currentSession);
    });

    // リスナーの設定
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
      }
    });

    // クリーンアップ関数: アンマウント時に購読を解除し、コールバックを防ぐ
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client, setSession, refreshSession]); // 依存配列に注意
  
  // ログイン時の初回データ取得
  // ・金融データはここで一度だけ取得（カレンダー等からは呼ばない）
  // ・イベントデータはログインごとに必ず最新を取得
  const hasFetchedFinancialRef = useRef(false);
  useEffect(() => {
    if (!session) return;
    if (!hasFetchedFinancialRef.current) {
      fetchFinancial();
      hasFetchedFinancialRef.current = true;
    }
    fetchEvents();
  }, [session, fetchEvents, fetchFinancial]);

  // タブ切り替え時の追加データ更新
  const prevTabRef = useRef<Tab | null>(null);
  useEffect(() => {
    if (!session) {
      prevTabRef.current = activeTab;
      return;
    }

    // イベントタブまたはカレンダーを表示するときは常に最新を取得
    if (['calendar', 'events'].includes(activeTab)) {
      fetchEvents();
    }

    prevTabRef.current = activeTab;
  }, [activeTab, session, fetchEvents]);

  const renderContent = () => {
    switch (activeTab) {
      case 'transactions':
        return (
          <div className="row">
            <div className="col-lg-4 input-form">
              <div className="mb-4">
                <JournalEntryForm />
                <EventScheduleForm />
              </div>
            </div>
            <div className="col-lg-8">
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
              <JournalAccountManager />
            </div>
            <div className="col-lg-4 mb-4">
              <AccountManager />
            </div>
            <div className="col-lg-4 mb-4">
              <CreditCardManager />
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
              supabaseClient={client}
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
          onClick={signOut} // ストアのsignOutを呼ぶだけ
          className="btn btn-outline-secondary custom-radius"
        >
          ログアウト
        </button>
      </footer>
    </div>
  );
}

export default App;