import { useState, useEffect } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from '@ionic/react';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';
import {
  useFinancialStore,
  type JournalEntry,
  type JournalAccount,
} from '@asset-simulator/shared';

interface Props {
  mode: 'new' | 'edit';
  defaultDate?: string;
  entry?: JournalEntry;
  accounts: JournalAccount[];
  onClose: () => void;
}

const JournalEntryForm: React.FC<Props> = ({ mode, defaultDate, entry, accounts, onClose }) => {
  const addJournalEntry = useFinancialStore((s) => s.addJournalEntry);
  const updateJournalEntry = useFinancialStore((s) => s.updateJournalEntry);

  const [date, setDate] = useState(entry?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(entry?.description ?? '');
  const [debitAccountId, setDebitAccountId] = useState(entry?.debitAccountId ?? '');
  const [creditAccountId, setCreditAccountId] = useState(entry?.creditAccountId ?? '');
  const [amount, setAmount] = useState(entry?.amount?.toString() ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setDescription(entry.description);
      setDebitAccountId(entry.debitAccountId);
      setCreditAccountId(entry.creditAccountId);
      setAmount(entry.amount.toString());
    }
  }, [entry]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!date) errs.push('日付を入力してください');
    if (!debitAccountId) errs.push('借方勘定を選択してください');
    if (!creditAccountId) errs.push('貸方勘定を選択してください');
    if (debitAccountId && creditAccountId && debitAccountId === creditAccountId)
      errs.push('借方と貸方は異なる勘定を選択してください');
    const amountNum = Number(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0)
      errs.push('正の金額を入力してください');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const data = {
      date,
      description: description.trim(),
      debitAccountId,
      creditAccountId,
      amount: Number(amount),
      user_id: '',
    };

    if (mode === 'edit' && entry) {
      await updateJournalEntry({ ...data, id: entry.id });
    } else {
      await addJournalEntry(data);
    }
    onClose();
  };

  // カテゴリ別にグループ化
  const groupedAccounts: Record<string, JournalAccount[]> = {};
  for (const acc of accounts) {
    if (!groupedAccounts[acc.category]) groupedAccounts[acc.category] = [];
    groupedAccounts[acc.category].push(acc);
  }

  const categoryLabel: Record<string, string> = {
    Asset: '資産',
    Liability: '負債',
    Equity: '純資産',
    Revenue: '収益',
    Expense: '費用',
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{mode === 'edit' ? '仕訳を編集' : '仕訳を追加'}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={handleSave}>
              <IonIcon icon={checkmarkOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {errors.length > 0 && (
          <div
            style={{
              background: '#fff0f0',
              border: '1px solid #eb445a',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 12,
            }}
          >
            {errors.map((e, i) => (
              <div key={i} style={{ color: '#eb445a', fontSize: '0.85rem' }}>
                {e}
              </div>
            ))}
          </div>
        )}

        <IonList>
          <IonItem>
            <IonLabel position="stacked">日付</IonLabel>
            <IonInput
              type="date"
              value={date}
              onIonChange={(e) => setDate(e.detail.value ?? '')}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">摘要</IonLabel>
            <IonTextarea
              value={description}
              onIonInput={(e) => setDescription(e.detail.value ?? '')}
              placeholder="取引の摘要を入力"
              rows={2}
              maxlength={200}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">借方勘定</IonLabel>
            <IonSelect
              value={debitAccountId}
              onIonChange={(e) => setDebitAccountId(e.detail.value)}
              placeholder="借方勘定を選択"
              interface="action-sheet"
            >
              {Object.entries(groupedAccounts).map(([cat, accs]) => (
                accs.map((acc) => (
                  <IonSelectOption key={acc.id} value={acc.id}>
                    [{categoryLabel[cat]}] {acc.name}
                  </IonSelectOption>
                ))
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">貸方勘定</IonLabel>
            <IonSelect
              value={creditAccountId}
              onIonChange={(e) => setCreditAccountId(e.detail.value)}
              placeholder="貸方勘定を選択"
              interface="action-sheet"
            >
              {Object.entries(groupedAccounts).map(([cat, accs]) => (
                accs.map((acc) => (
                  <IonSelectOption key={acc.id} value={acc.id}>
                    [{categoryLabel[cat]}] {acc.name}
                  </IonSelectOption>
                ))
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">金額</IonLabel>
            <IonInput
              type="number"
              value={amount}
              onIonInput={(e) => setAmount(e.detail.value ?? '')}
              placeholder="0"
              min="0"
              inputMode="numeric"
            />
          </IonItem>
        </IonList>
      </IonContent>
    </>
  );
};

export default JournalEntryForm;
