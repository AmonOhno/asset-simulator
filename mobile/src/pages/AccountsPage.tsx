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
  IonListHeader,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonButtons,
  RefresherEventDetail,
} from '@ionic/react';
import {
  addOutline,
  createOutline,
  trashOutline,
  closeOutline,
  checkmarkOutline,
} from 'ionicons/icons';
import {
  useFinancialStore,
  type JournalAccount,
  type AccountCategory,
} from '@asset-simulator/shared';

const categoryLabel: Record<AccountCategory, string> = {
  Asset: '資産',
  Liability: '負債',
  Equity: '純資産',
  Revenue: '収益',
  Expense: '費用',
};

const categoryOrder: AccountCategory[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

const AccountsPage: React.FC = () => {
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);
  const getJournalAccounts = useFinancialStore((s) => s.getJournalAccounts);
  const addJournalAccount = useFinancialStore((s) => s.addJournalAccount);
  const updateJournalAccount = useFinancialStore((s) => s.updateJournalAccount);
  const deleteJournalAccount = useFinancialStore((s) => s.deleteJournalAccount);

  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<JournalAccount | null>(null);

  // フォーム
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<AccountCategory>('Asset');

  useEffect(() => {
    setLoading(true);
    getJournalAccounts().finally(() => setLoading(false));
  }, [getJournalAccounts]);

  const filteredAccounts = useMemo(() => {
    if (!searchText.trim()) return journalAccounts;
    const q = searchText.toLowerCase();
    return journalAccounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        categoryLabel[a.category].includes(q)
    );
  }, [journalAccounts, searchText]);

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, JournalAccount[]> = {};
    for (const cat of categoryOrder) groups[cat] = [];
    for (const acc of filteredAccounts) {
      if (groups[acc.category]) groups[acc.category].push(acc);
    }
    return groups;
  }, [filteredAccounts]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await getJournalAccounts();
    event.detail.complete();
  };

  const openNewForm = () => {
    setEditAccount(null);
    setFormName('');
    setFormCategory('Asset');
    setShowForm(true);
  };

  const openEditForm = (acc: JournalAccount) => {
    setEditAccount(acc);
    setFormName(acc.name);
    setFormCategory(acc.category);
    setShowForm(true);
  };

  const isSystemAccount = (acc: JournalAccount) =>
    acc.id.startsWith('acc_') || acc.id.startsWith('card_');

  const handleSave = async () => {
    if (!formName.trim()) return;

    if (editAccount) {
      await updateJournalAccount({
        ...editAccount,
        name: formName.trim(),
        category: formCategory,
      });
    } else {
      await addJournalAccount({
        name: formName.trim(),
        category: formCategory,
        balance: 0,
        user_id: '',
      });
    }
    setShowForm(false);
    setEditAccount(null);
  };

  const handleDelete = async (acc: JournalAccount) => {
    await deleteJournalAccount(acc);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>勘定科目</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonSearchbar
          value={searchText}
          onIonInput={(e) => setSearchText(e.detail.value ?? '')}
          placeholder="科目名で検索"
          debounce={300}
        />

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <IonSpinner />
          </div>
        )}

        {categoryOrder.map((cat) => {
          const accounts = groupedAccounts[cat];
          if (!accounts || accounts.length === 0) return null;
          return (
            <IonList key={cat}>
              <IonListHeader>
                <IonLabel>{categoryLabel[cat]}</IonLabel>
              </IonListHeader>
              {accounts.map((acc) => (
                <IonItemSliding key={acc.id}>
                  <IonItem>
                    <IonLabel>
                      <h3>{acc.name}</h3>
                      {isSystemAccount(acc) && (
                        <p style={{ fontSize: '0.7rem', color: '#888' }}>システム科目</p>
                      )}
                    </IonLabel>
                    <IonNote slot="end">¥{acc.balance.toLocaleString()}</IonNote>
                  </IonItem>
                  {!isSystemAccount(acc) && (
                    <IonItemOptions side="end">
                      <IonItemOption color="primary" onClick={() => openEditForm(acc)}>
                        <IonIcon icon={createOutline} slot="icon-only" />
                      </IonItemOption>
                      <IonItemOption color="danger" onClick={() => handleDelete(acc)}>
                        <IonIcon icon={trashOutline} slot="icon-only" />
                      </IonItemOption>
                    </IonItemOptions>
                  )}
                </IonItemSliding>
              ))}
            </IonList>
          );
        })}

        {/* FAB: 新規追加 */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openNewForm}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* 追加・編集モーダル */}
        <IonModal isOpen={showForm} onDidDismiss={() => setShowForm(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowForm(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>{editAccount ? '勘定科目を編集' : '勘定科目を追加'}</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={handleSave} disabled={!formName.trim()}>
                  <IonIcon icon={checkmarkOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel position="stacked">科目名</IonLabel>
                <IonInput
                  value={formName}
                  onIonInput={(e) => setFormName(e.detail.value ?? '')}
                  placeholder="例: 食費"
                  maxlength={50}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">カテゴリ</IonLabel>
                <IonSelect
                  value={formCategory}
                  onIonChange={(e) => setFormCategory(e.detail.value)}
                  disabled={editAccount !== null && isSystemAccount(editAccount)}
                >
                  {categoryOrder.map((cat) => (
                    <IonSelectOption key={cat} value={cat}>
                      {categoryLabel[cat]}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonList>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AccountsPage;
