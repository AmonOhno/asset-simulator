import { useEffect, useRef } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  calendarOutline,
  statsChartOutline,
  repeatOutline,
  listOutline,
} from 'ionicons/icons';

import {
  useAuthStore,
  useFinancialStore,
  useEventsStore,
} from '@asset-simulator/shared';

import LoginPage from './pages/LoginPage';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import RecurringPage from './pages/RecurringPage';
import AccountsPage from './pages/AccountsPage';

setupIonicReact({ mode: 'ios' });

const App: React.FC = () => {
  const { session, client, setSession, refreshSession } = useAuthStore();
  const fetchFinancial = useFinancialStore((s) => s.fetchFinancial);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);

  // 認証状態の監視
  useEffect(() => {
    let isMounted = true;

    refreshSession().then((currentSession) => {
      if (isMounted) setSession(currentSession);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client, setSession, refreshSession]);

  // ログイン時の初回データ取得
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!session) return;
    if (!hasFetchedRef.current) {
      fetchFinancial();
      hasFetchedRef.current = true;
    }
    fetchEvents();
  }, [session, fetchEvents, fetchFinancial]);

  if (!session) {
    return (
      <IonApp>
        <LoginPage />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/calendar" component={CalendarPage} />
            <Route exact path="/dashboard" component={DashboardPage} />
            <Route exact path="/recurring" component={RecurringPage} />
            <Route exact path="/accounts" component={AccountsPage} />
            <Route exact path="/">
              <Redirect to="/calendar" />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            <IonTabButton tab="calendar" href="/calendar">
              <IonIcon icon={calendarOutline} />
              <IonLabel>カレンダー</IonLabel>
            </IonTabButton>
            <IonTabButton tab="dashboard" href="/dashboard">
              <IonIcon icon={statsChartOutline} />
              <IonLabel>ダッシュボード</IonLabel>
            </IonTabButton>
            <IonTabButton tab="recurring" href="/recurring">
              <IonIcon icon={repeatOutline} />
              <IonLabel>定期取引</IonLabel>
            </IonTabButton>
            <IonTabButton tab="accounts" href="/accounts">
              <IonIcon icon={listOutline} />
              <IonLabel>勘定科目</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
