import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonNote,
  IonList,
  IonListHeader,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonInput,
  IonSpinner,
  RefresherEventDetail,
} from '@ionic/react';
import {
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import {
  useFinancialStore,
  type BalanceSheetView,
  type ProfitLossView,
} from '@asset-simulator/shared';

type ViewMode = 'bs' | 'pl';

const DashboardPage: React.FC = () => {
  const getBalanceSheetView = useFinancialStore((s) => s.getBalanceSheetView);
  const getProfitLossStatementView = useFinancialStore((s) => s.getProfitLossStatementView);

  const [viewMode, setViewMode] = useState<ViewMode>('bs');
  const [bsData, setBsData] = useState<BalanceSheetView[]>([]);
  const [plData, setPlData] = useState<ProfitLossView[]>([]);
  const [loading, setLoading] = useState(false);

  // BS基準日
  const [bsAsOfDate, setBsAsOfDate] = useState(new Date().toISOString().slice(0, 10));

  // PL期間
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [plStartDate, setPlStartDate] = useState(firstOfMonth.toISOString().slice(0, 10));
  const [plEndDate, setPlEndDate] = useState(today.toISOString().slice(0, 10));

  const fetchBS = useCallback(async () => {
    setLoading(true);
    const data = await getBalanceSheetView(bsAsOfDate);
    setBsData(data);
    setLoading(false);
  }, [getBalanceSheetView, bsAsOfDate]);

  const fetchPL = useCallback(async () => {
    setLoading(true);
    const data = await getProfitLossStatementView(plStartDate, plEndDate);
    setPlData(data);
    setLoading(false);
  }, [getProfitLossStatementView, plStartDate, plEndDate]);

  useEffect(() => {
    if (viewMode === 'bs') fetchBS();
    else fetchPL();
  }, [viewMode, fetchBS, fetchPL]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    if (viewMode === 'bs') await fetchBS();
    else await fetchPL();
    event.detail.complete();
  };

  // PL月移動
  const movePLMonth = (dir: number) => {
    const start = new Date(plStartDate);
    start.setMonth(start.getMonth() + dir);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    setPlStartDate(start.toISOString().slice(0, 10));
    setPlEndDate(end.toISOString().slice(0, 10));
  };

  // BS/PLデータをカテゴリ別にグループ化
  const groupByCategory = <T extends { category: string; name: string; sumAmount: number }>(
    data: T[]
  ) => {
    const groups: Record<string, T[]> = {};
    for (const item of data) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  };

  const categoryLabel: Record<string, string> = {
    Asset: '資産',
    Liability: '負債',
    Equity: '純資産',
    Revenue: '収益',
    Expense: '費用',
  };

  const bsGroups = useMemo(() => groupByCategory(bsData), [bsData]);
  const plGroups = useMemo(() => groupByCategory(plData), [plData]);

  const bsTotal = useMemo(() => {
    const assets = bsData.filter((d) => d.category === 'Asset').reduce((s, d) => s + d.sumAmount, 0);
    const liabilities = bsData.filter((d) => d.category === 'Liability').reduce((s, d) => s + d.sumAmount, 0);
    const equity = bsData.filter((d) => d.category === 'Equity').reduce((s, d) => s + d.sumAmount, 0);
    return { assets, liabilities, equity, netAssets: assets - liabilities };
  }, [bsData]);

  const plTotal = useMemo(() => {
    const revenue = plData.filter((d) => d.category === 'Revenue').reduce((s, d) => s + d.sumAmount, 0);
    const expense = plData.filter((d) => d.category === 'Expense').reduce((s, d) => s + d.sumAmount, 0);
    return { revenue, expense, profit: revenue - expense };
  }, [plData]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>ダッシュボード</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* BS / PL 切り替え */}
        <IonSegment
          value={viewMode}
          onIonChange={(e) => setViewMode(e.detail.value as ViewMode)}
          style={{ margin: '8px 16px' }}
        >
          <IonSegmentButton value="bs">
            <IonLabel>貸借対照表</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="pl">
            <IonLabel>損益計算書</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <IonSpinner />
          </div>
        )}

        {/* === 貸借対照表 === */}
        {viewMode === 'bs' && !loading && (
          <>
            {/* 基準日設定 */}
            <IonItem>
              <IonLabel position="stacked">基準日</IonLabel>
              <IonInput
                type="date"
                value={bsAsOfDate}
                onIonChange={(e) => {
                  if (e.detail.value) setBsAsOfDate(e.detail.value);
                }}
              />
            </IonItem>

            {/* サマリーカード */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1rem' }}>サマリー</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>資産合計</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2dd36f' }}>
                      ¥{bsTotal.assets.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>負債合計</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#eb445a' }}>
                      ¥{bsTotal.liabilities.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>純資産</div>
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: bsTotal.netAssets >= 0 ? '#2dd36f' : '#eb445a',
                      }}
                    >
                      ¥{bsTotal.netAssets.toLocaleString()}
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* カテゴリ別明細 */}
            {(['Asset', 'Liability', 'Equity'] as const).map((cat) => {
              const items = bsGroups[cat];
              if (!items || items.length === 0) return null;
              return (
                <IonList key={cat}>
                  <IonListHeader>
                    <IonLabel>{categoryLabel[cat]}</IonLabel>
                  </IonListHeader>
                  {items.map((item) => (
                    <IonItem key={item.accountId}>
                      <IonLabel>{item.name}</IonLabel>
                      <IonNote slot="end">¥{item.sumAmount.toLocaleString()}</IonNote>
                    </IonItem>
                  ))}
                </IonList>
              );
            })}
          </>
        )}

        {/* === 損益計算書 === */}
        {viewMode === 'pl' && !loading && (
          <>
            {/* 期間設定 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
              }}
            >
              <IonButton fill="clear" size="small" onClick={() => movePLMonth(-1)}>
                <IonIcon icon={chevronBackOutline} />
              </IonButton>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                {plStartDate} ～ {plEndDate}
              </div>
              <IonButton fill="clear" size="small" onClick={() => movePLMonth(1)}>
                <IonIcon icon={chevronForwardOutline} />
              </IonButton>
            </div>

            {/* サマリーカード */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ fontSize: '1rem' }}>サマリー</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>収益合計</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2dd36f' }}>
                      ¥{plTotal.revenue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>費用合計</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#eb445a' }}>
                      ¥{plTotal.expense.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>損益</div>
                    <div
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: plTotal.profit >= 0 ? '#2dd36f' : '#eb445a',
                      }}
                    >
                      ¥{plTotal.profit.toLocaleString()}
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>

            {/* カテゴリ別明細 */}
            {(['Revenue', 'Expense'] as const).map((cat) => {
              const items = plGroups[cat];
              if (!items || items.length === 0) return null;
              return (
                <IonList key={cat}>
                  <IonListHeader>
                    <IonLabel>{categoryLabel[cat]}</IonLabel>
                  </IonListHeader>
                  {items.map((item) => (
                    <IonItem key={item.accountId}>
                      <IonLabel>{item.name}</IonLabel>
                      <IonNote slot="end">¥{item.sumAmount.toLocaleString()}</IonNote>
                    </IonItem>
                  ))}
                </IonList>
              );
            })}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;
