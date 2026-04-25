import { useState, useEffect, useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSpinner,
  IonAlert,
  RefresherEventDetail,
} from '@ionic/react';
import {
  addOutline,
  playOutline,
  createOutline,
  trashOutline,
  flashOutline,
} from 'ionicons/icons';
import {
  useFinancialStore,
  type RecurringTransaction,
  type JournalAccount,
} from '@asset-simulator/shared';

const frequencyLabel: Record<string, string> = {
  free: 'フリー',
  weekly: '毎週',
  monthly: '毎月',
  yearly: '毎年',
};

const RecurringPage: React.FC = () => {
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);
  const regularJournalEntries = useFinancialStore((s) => s.regularJournalEntries);
  const getRegularJournalEntries = useFinancialStore((s) => s.getRegularJournalEntries);
  const deleteRegularJournalEntry = useFinancialStore((s) => s.deleteRegularJournalEntry);
  const executeRegularJournalEntry = useFinancialStore((s) => s.executeRegularJournalEntry);
  const executeDueRegularJournalEntries = useFinancialStore(
    (s) => s.executeDueRegularJournalEntries
  );

  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExecDueAlert, setShowExecDueAlert] = useState(false);

  useEffect(() => {
    setLoading(true);
    getRegularJournalEntries().finally(() => setLoading(false));
  }, [getRegularJournalEntries]);

  const accountName = (id: string) => {
    return journalAccounts.find((a) => a.id === id)?.name ?? id;
  };

  const filteredEntries = useMemo(() => {
    if (!searchText.trim()) return regularJournalEntries;
    const q = searchText.toLowerCase();
    return regularJournalEntries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        accountName(e.debitAccountId).toLowerCase().includes(q) ||
        accountName(e.creditAccountId).toLowerCase().includes(q)
    );
  }, [regularJournalEntries, searchText, journalAccounts]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await getRegularJournalEntries();
    event.detail.complete();
  };

  const handleExecute = async (entry: RecurringTransaction) => {
    await executeRegularJournalEntry(entry);
    await getRegularJournalEntries();
  };

  const handleDelete = async (entry: RecurringTransaction) => {
    await deleteRegularJournalEntry(entry);
  };

  const handleExecuteDue = async () => {
    await executeDueRegularJournalEntries();
    await getRegularJournalEntries();
    setShowExecDueAlert(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>定期取引</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* 一括実行ボタン */}
        <div style={{ padding: '8px 16px' }}>
          <IonButton
            expand="block"
            fill="outline"
            color="warning"
            onClick={() => setShowExecDueAlert(true)}
          >
            <IonIcon icon={flashOutline} slot="start" />
            期限到来分を一括実行
          </IonButton>
        </div>

        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value ?? '')}
          placeholder="名前・勘定科目で検索"
          debounce={300}
        />

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <IonSpinner />
          </div>
        )}

        <IonList>
          {filteredEntries.map((entry) => (
            <IonItemSliding key={entry.id}>
              <IonItem>
                <IonLabel>
                  <h2>{entry.name}</h2>
                  <p>
                    {accountName(entry.debitAccountId)} → {accountName(entry.creditAccountId)}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#888' }}>
                    {frequencyLabel[entry.frequency] ?? entry.frequency}
                    {entry.lastExecutedDate && ` | 最終: ${entry.lastExecutedDate}`}
                  </p>
                </IonLabel>
                <div slot="end" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <IonNote>
                    {entry.amount > 0
                      ? `¥${entry.amount.toLocaleString()}`
                      : '実行時入力'}
                  </IonNote>
                  <IonBadge color="medium" style={{ fontSize: '0.65rem' }}>
                    {frequencyLabel[entry.frequency]}
                  </IonBadge>
                </div>
              </IonItem>

              <IonItemOptions side="end">
                <IonItemOption color="success" onClick={() => handleExecute(entry)}>
                  <IonIcon icon={playOutline} slot="icon-only" />
                </IonItemOption>
                <IonItemOption color="danger" onClick={() => handleDelete(entry)}>
                  <IonIcon icon={trashOutline} slot="icon-only" />
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}

          {!loading && filteredEntries.length === 0 && (
            <IonItem>
              <IonLabel className="ion-text-center" color="medium">
                定期取引なし
              </IonLabel>
            </IonItem>
          )}
        </IonList>

        <IonAlert
          isOpen={showExecDueAlert}
          onDidDismiss={() => setShowExecDueAlert(false)}
          header="一括実行"
          message="期限が到来している定期取引をすべて実行しますか？"
          buttons={[
            { text: 'キャンセル', role: 'cancel' },
            { text: '実行', handler: handleExecuteDue },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default RecurringPage;
