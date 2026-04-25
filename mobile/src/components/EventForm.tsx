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
  IonTextarea,
  IonToggle,
} from '@ionic/react';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';
import {
  useEventsStore,
  type ScheduleEvent,
} from '@asset-simulator/shared';

interface Props {
  mode: 'new' | 'edit';
  defaultDate?: string;
  event?: ScheduleEvent;
  onClose: () => void;
}

const EventForm: React.FC<Props> = ({ mode, defaultDate, event, onClose }) => {
  const addEvent = useEventsStore((s) => s.addEvent);
  const updateEvent = useEventsStore((s) => s.updateEvent);

  const [title, setTitle] = useState(event?.title ?? '');
  const [allDayFlg, setAllDayFlg] = useState(event?.allDayFlg ?? true);
  const [startDate, setStartDate] = useState(
    event?.startDate ?? defaultDate ?? new Date().toISOString().slice(0, 10)
  );
  const [startTime, setStartTime] = useState(event?.startTime ?? '09:00');
  const [endDate, setEndDate] = useState(
    event?.endDate ?? defaultDate ?? new Date().toISOString().slice(0, 10)
  );
  const [endTime, setEndTime] = useState(event?.endTime ?? '10:00');
  const [description, setDescription] = useState(event?.description ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setAllDayFlg(event.allDayFlg);
      setStartDate(event.startDate);
      setStartTime(event.startTime ?? '09:00');
      setEndDate(event.endDate);
      setEndTime(event.endTime ?? '10:00');
      setDescription(event.description ?? '');
    }
  }, [event]);

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!title.trim()) errs.push('タイトルを入力してください');
    if (title.length > 100) errs.push('タイトルは100文字以内にしてください');
    if (!startDate) errs.push('開始日を入力してください');
    if (!endDate) errs.push('終了日を入力してください');
    if (startDate && endDate && startDate > endDate) errs.push('開始日は終了日以前にしてください');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const data = {
      title: title.trim(),
      allDayFlg,
      startDate,
      startTime: allDayFlg ? null : startTime,
      endDate,
      endTime: allDayFlg ? null : endTime,
      description: description.trim() || undefined,
      userId: '',
    };

    if (mode === 'edit' && event) {
      await updateEvent({
        ...data,
        eventId: event.eventId,
        createdAt: event.createdAt,
      });
    } else {
      await addEvent(data as Omit<ScheduleEvent, 'eventId' | 'createdAt'>);
    }
    onClose();
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
          <IonTitle>{mode === 'edit' ? 'イベントを編集' : 'イベントを追加'}</IonTitle>
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
            <IonLabel position="stacked">タイトル</IonLabel>
            <IonInput
              value={title}
              onIonInput={(e) => setTitle(e.detail.value ?? '')}
              placeholder="イベント名を入力"
              maxlength={100}
            />
          </IonItem>

          <IonItem>
            <IonLabel>終日</IonLabel>
            <IonToggle
              checked={allDayFlg}
              onIonChange={(e) => setAllDayFlg(e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">開始日</IonLabel>
            <IonInput
              type="date"
              value={startDate}
              onIonChange={(e) => setStartDate(e.detail.value ?? '')}
            />
          </IonItem>

          {!allDayFlg && (
            <IonItem>
              <IonLabel position="stacked">開始時間</IonLabel>
              <IonInput
                type="time"
                value={startTime}
                onIonChange={(e) => setStartTime(e.detail.value ?? '')}
              />
            </IonItem>
          )}

          <IonItem>
            <IonLabel position="stacked">終了日</IonLabel>
            <IonInput
              type="date"
              value={endDate}
              onIonChange={(e) => setEndDate(e.detail.value ?? '')}
            />
          </IonItem>

          {!allDayFlg && (
            <IonItem>
              <IonLabel position="stacked">終了時間</IonLabel>
              <IonInput
                type="time"
                value={endTime}
                onIonChange={(e) => setEndTime(e.detail.value ?? '')}
              />
            </IonItem>
          )}

          <IonItem>
            <IonLabel position="stacked">説明</IonLabel>
            <IonTextarea
              value={description}
              onIonInput={(e) => setDescription(e.detail.value ?? '')}
              placeholder="イベントの説明"
              rows={3}
              maxlength={500}
            />
          </IonItem>
        </IonList>
      </IonContent>
    </>
  );
};

export default EventForm;
