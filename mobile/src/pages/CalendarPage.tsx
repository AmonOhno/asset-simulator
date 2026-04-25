import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonFab,
  IonFabButton,
  IonModal,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonNote,
  RefresherEventDetail,
} from '@ionic/react';
import {
  chevronBackOutline,
  chevronForwardOutline,
  addOutline,
  logOutOutline,
  createOutline,
  trashOutline,
  calendarOutline as calendarIcon,
} from 'ionicons/icons';

import {
  useAuthStore,
  useFinancialStore,
  useEventsStore,
  type CalendarJournalEntry,
  type ScheduleEvent,
  type JournalAccount,
} from '@asset-simulator/shared';

import JournalEntryForm from '../components/JournalEntryForm';
import EventForm from '../components/EventForm';

type EntryOrEvent =
  | { type: 'journal'; data: CalendarJournalEntry }
  | { type: 'event'; data: ScheduleEvent };

type FormMode = 'newJournal' | 'editJournal' | 'newEvent' | 'editEvent' | null;

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const CalendarPage: React.FC = () => {
  const signOut = useAuthStore((s) => s.signOut);
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);
  const getCalendarJournalEntries = useFinancialStore((s) => s.getCalendarJournalEntries);
  const getJournalAccounts = useFinancialStore((s) => s.getJournalAccounts);
  const deleteJournalEntry = useFinancialStore((s) => s.deleteJournalEntry);
  const { events, fetchEvents, deleteEvent } = useEventsStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [calendarEntries, setCalendarEntries] = useState<CalendarJournalEntry[]>([]);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editJournalEntry, setEditJournalEntry] = useState<CalendarJournalEntry | null>(null);
  const [editEvent, setEditEvent] = useState<ScheduleEvent | null>(null);
  const [filterSegment, setFilterSegment] = useState<'all' | 'journal' | 'event'>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // カレンダー範囲の仕訳取得
  const fetchCalendarData = useCallback(async () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = firstDay.toISOString().slice(0, 10);
    const endDate = lastDay.toISOString().slice(0, 10);
    const entries = await getCalendarJournalEntries(startDate, endDate);
    setCalendarEntries(entries);
  }, [year, month, getCalendarJournalEntries]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // 月移動
  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().slice(0, 10));
  };

  // カレンダーグリッドの日付生成
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    // 前月
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const date = new Date(year, month - 1, d);
      days.push({
        date: date.toISOString().slice(0, 10),
        day: d,
        isCurrentMonth: false,
      });
    }

    // 当月
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({
        date: date.toISOString().slice(0, 10),
        day: d,
        isCurrentMonth: true,
      });
    }

    // 次月
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const date = new Date(year, month + 1, d);
        days.push({
          date: date.toISOString().slice(0, 10),
          day: d,
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [year, month]);

  // 日ごとのエントリ index 生成
  const entriesByDate = useMemo(() => {
    const map: Record<string, { hasExpense: boolean; hasRevenue: boolean; hasEvent: boolean }> = {};

    for (const e of calendarEntries) {
      if (!map[e.date]) map[e.date] = { hasExpense: false, hasRevenue: false, hasEvent: false };
      if (e.debitAccountCategory === 'Expense') map[e.date].hasExpense = true;
      if (e.creditAccountCategory === 'Revenue' || e.debitAccountCategory === 'Revenue')
        map[e.date].hasRevenue = true;
    }

    for (const ev of events) {
      const start = ev.startDate;
      const end = ev.endDate;
      // 期間内の各日にマーク
      const d = new Date(start);
      const endD = new Date(end);
      while (d <= endD) {
        const key = d.toISOString().slice(0, 10);
        if (!map[key]) map[key] = { hasExpense: false, hasRevenue: false, hasEvent: false };
        map[key].hasEvent = true;
        d.setDate(d.getDate() + 1);
      }
    }

    return map;
  }, [calendarEntries, events]);

  // 選択日のエントリ・イベント取得
  const selectedItems: EntryOrEvent[] = useMemo(() => {
    const items: EntryOrEvent[] = [];

    if (filterSegment !== 'event') {
      for (const e of calendarEntries) {
        if (e.date === selectedDate) items.push({ type: 'journal', data: e });
      }
    }

    if (filterSegment !== 'journal') {
      for (const ev of events) {
        if (selectedDate >= ev.startDate && selectedDate <= ev.endDate) {
          items.push({ type: 'event', data: ev });
        }
      }
    }

    return items;
  }, [calendarEntries, events, selectedDate, filterSegment]);

  // プルトゥリフレッシュ
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await Promise.all([fetchCalendarData(), fetchEvents(), getJournalAccounts()]);
    event.detail.complete();
  };

  const today = new Date().toISOString().slice(0, 10);

  // 合計計算
  const { totalExpense, totalRevenue } = useMemo(() => {
    let expense = 0;
    let revenue = 0;
    for (const e of calendarEntries) {
      if (e.date !== selectedDate) continue;
      if (e.debitAccountCategory === 'Expense') expense += e.amount;
      if (e.debitAccountCategory === 'Revenue' || e.creditAccountCategory === 'Revenue')
        revenue += e.amount;
    }
    return { totalExpense: expense, totalRevenue: revenue };
  }, [calendarEntries, selectedDate]);

  const handleDeleteJournal = async (entry: CalendarJournalEntry) => {
    await deleteJournalEntry({
      id: entry.id,
      date: entry.date,
      description: entry.description,
      debitAccountId: entry.debitAccountId,
      creditAccountId: entry.creditAccountId,
      amount: entry.amount,
      user_id: entry.userId,
    });
    await fetchCalendarData();
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
  };

  const handleFormClose = async () => {
    setFormMode(null);
    setEditJournalEntry(null);
    setEditEvent(null);
    await fetchCalendarData();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>カレンダー</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={signOut}>
              <IonIcon icon={logOutOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* 月ナビゲーション */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
          }}
        >
          <IonButton fill="clear" size="small" onClick={goToPrevMonth}>
            <IonIcon icon={chevronBackOutline} />
          </IonButton>
          <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>
            {year}年 {month + 1}月
          </div>
          <IonButton fill="clear" size="small" onClick={goToNextMonth}>
            <IonIcon icon={chevronForwardOutline} />
          </IonButton>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <IonButton size="small" fill="outline" onClick={goToToday}>
            今日
          </IonButton>
        </div>

        {/* カレンダーグリッド */}
        <div className="calendar-grid" style={{ margin: '0 8px' }}>
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className="calendar-header-cell"
              style={{ color: i === 0 ? '#eb445a' : i === 6 ? '#3880ff' : undefined }}
            >
              {w}
            </div>
          ))}
          {calendarDays.map((d) => {
            const info = entriesByDate[d.date];
            const dayOfWeek = new Date(d.date).getDay();
            return (
              <div
                key={d.date}
                className={[
                  'calendar-cell',
                  !d.isCurrentMonth ? 'other-month' : '',
                  d.date === today ? 'today' : '',
                  d.date === selectedDate ? 'selected' : '',
                ].join(' ')}
                onClick={() => setSelectedDate(d.date)}
              >
                <span
                  className="day-number"
                  style={{
                    color:
                      d.date === selectedDate
                        ? '#fff'
                        : dayOfWeek === 0
                        ? '#eb445a'
                        : dayOfWeek === 6
                        ? '#3880ff'
                        : undefined,
                  }}
                >
                  {d.day}
                </span>
                {info && (
                  <div className="dot-container">
                    {info.hasExpense && <span className="dot expense" />}
                    {info.hasRevenue && <span className="dot revenue" />}
                    {info.hasEvent && <span className="dot event" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 選択日の情報 */}
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong>{selectedDate}</strong>
            {totalExpense > 0 && (
              <IonBadge color="danger">支出 ¥{totalExpense.toLocaleString()}</IonBadge>
            )}
            {totalRevenue > 0 && (
              <IonBadge color="success">収入 ¥{totalRevenue.toLocaleString()}</IonBadge>
            )}
          </div>
        </div>

        {/* フィルター */}
        <IonSegment
          value={filterSegment}
          onIonChange={(e) => setFilterSegment(e.detail.value as 'all' | 'journal' | 'event')}
          style={{ margin: '0 16px' }}
        >
          <IonSegmentButton value="all">
            <IonLabel>すべて</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="journal">
            <IonLabel>仕訳</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="event">
            <IonLabel>イベント</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* エントリ一覧 */}
        <IonList>
          {selectedItems.length === 0 && (
            <IonItem>
              <IonLabel className="ion-text-center" color="medium">
                データなし
              </IonLabel>
            </IonItem>
          )}
          {selectedItems.map((item, idx) => {
            if (item.type === 'journal') {
              const e = item.data;
              return (
                <IonItem key={`j-${e.id}`}>
                  <IonLabel>
                    <h3>{e.description || '(摘要なし)'}</h3>
                    <p>
                      {e.debitAccountName} → {e.creditAccountName}
                    </p>
                  </IonLabel>
                  <IonNote slot="end" color={e.debitAccountCategory === 'Expense' ? 'danger' : 'dark'}>
                    ¥{e.amount.toLocaleString()}
                  </IonNote>
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => {
                      setEditJournalEntry(e);
                      setFormMode('editJournal');
                    }}
                  >
                    <IonIcon icon={createOutline} />
                  </IonButton>
                  <IonButton
                    fill="clear"
                    color="danger"
                    slot="end"
                    onClick={() => handleDeleteJournal(e)}
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </IonItem>
              );
            } else {
              const ev = item.data;
              return (
                <IonItem key={`e-${ev.eventId}`}>
                  <IonIcon icon={calendarIcon} slot="start" color="primary" />
                  <IonLabel>
                    <h3>{ev.title}</h3>
                    <p>
                      {ev.allDayFlg
                        ? '終日'
                        : `${ev.startTime ?? ''} - ${ev.endTime ?? ''}`}
                    </p>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => {
                      setEditEvent(ev);
                      setFormMode('editEvent');
                    }}
                  >
                    <IonIcon icon={createOutline} />
                  </IonButton>
                  <IonButton
                    fill="clear"
                    color="danger"
                    slot="end"
                    onClick={() => handleDeleteEvent(ev.eventId)}
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </IonItem>
              );
            }
          })}
        </IonList>

        {/* FAB: 新規追加 */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: 16 }}>
          <IonFabButton onClick={() => setFormMode('newJournal')}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* 仕訳フォームモーダル */}
        <IonModal
          isOpen={formMode === 'newJournal' || formMode === 'editJournal'}
          onDidDismiss={handleFormClose}
        >
          <JournalEntryForm
            mode={formMode === 'editJournal' ? 'edit' : 'new'}
            defaultDate={selectedDate}
            entry={
              editJournalEntry
                ? {
                    id: editJournalEntry.id,
                    date: editJournalEntry.date,
                    description: editJournalEntry.description,
                    debitAccountId: editJournalEntry.debitAccountId,
                    creditAccountId: editJournalEntry.creditAccountId,
                    amount: editJournalEntry.amount,
                    user_id: editJournalEntry.userId,
                  }
                : undefined
            }
            accounts={journalAccounts}
            onClose={handleFormClose}
          />
        </IonModal>

        {/* イベントフォームモーダル */}
        <IonModal
          isOpen={formMode === 'newEvent' || formMode === 'editEvent'}
          onDidDismiss={handleFormClose}
        >
          <EventForm
            mode={formMode === 'editEvent' ? 'edit' : 'new'}
            defaultDate={selectedDate}
            event={editEvent ?? undefined}
            onClose={handleFormClose}
          />
        </IonModal>

        {/* 新規イベントボタン（セグメントがイベント時） */}
        {filterSegment === 'event' && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ marginBottom: 16 }}>
            <IonFabButton color="secondary" onClick={() => setFormMode('newEvent')}>
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CalendarPage;
