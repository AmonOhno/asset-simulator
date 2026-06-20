import React, { useState } from 'react';
import { useEventsStore, ScheduleEvent } from '@asset-simulator/shared';
import { EventScheduleForm } from './EventScheduleForm';

export const EventScheduleManager: React.FC = () => {
  const { events, updateEvent, deleteEvent } = useEventsStore();
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  // データ取得は App.tsx で一元管理されるため、useEffect を削除

  const handleEdit = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (window.confirm('このイベントを削除しますか？')) {
      try {
        console.log('削除開始:', eventId);
        await deleteEvent(eventId);
        console.log('削除完了:', eventId);
        // deleteEvent メソッドがローカル状態を更新するため、fetchEvents は不要
        console.log('ローカル状態更新完了');
        alert('イベントを削除しました');
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert(`削除に失敗しました: ${error}`);
      }
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP');
  };

  const formatTime = (time: string | null | undefined) => {
    return time ? time.substring(0, 5) : '';
  };

  const getFilteredEvents = (): ScheduleEvent[] => {
    const today = new Date().toISOString().split('T')[0];
    
    let filtered: ScheduleEvent[];
    switch (filter) {
      case 'upcoming':
        filtered = events.filter(event => event.startDate >= today);
        break;
      case 'past':
        filtered = events.filter(event => event.endDate < today);
        break;
      default:
        filtered = events;
    }
    
    // 日時順でソート（開始日・開始時間の昇順）
    return filtered.sort((a, b) => {
      // 開始日で比較
      const dateCompare = a.startDate.localeCompare(b.startDate);
      if (dateCompare !== 0) return dateCompare;
      
      // 開始日が同じ場合は開始時間で比較
      const aTime = a.startTime || '00:00';
      const bTime = b.startTime || '00:00';
      return aTime.localeCompare(bTime);
    });
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="container-fluid">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">イベント管理</h5>
          <div className="btn-group" role="group">
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              すべて
            </button>
            <button
              className={`btn btn-sm ${filter === 'upcoming' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('upcoming')}
            >
              今後
            </button>
            <button
              className={`btn btn-sm ${filter === 'past' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('past')}
            >
              過去
            </button>
          </div>
        </div>
        <div className="card-body">
          {filteredEvents.length === 0 ? (
            <div className="text-center text-muted">
              {filter === 'all' 
                ? 'イベントが登録されていません' 
                : filter === 'upcoming' 
                ? '今後のイベントはありません'
                : '過去のイベントはありません'
              }
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>タイトル</th>
                    <th>期間</th>
                    <th>時間</th>
                    <th>説明</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.eventId}>
                      <td>
                        <strong>{event.title}</strong>
                        {event.allDayFlg && (
                          <span className="badge bg-info ms-2">終日</span>
                        )}
                      </td>
                      <td>
                        <div>
                          {formatDate(event.startDate)}
                          {event.startDate !== event.endDate && (
                            <> 〜 {formatDate(event.endDate)}</>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          {!event.allDayFlg && (
                            <>
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">
                          {event.description ? 
                            (event.description.length > 50 
                              ? event.description.substring(0, 50) + '...' 
                              : event.description
                            ) : '-'
                          }
                        </small>
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(event)}
                          >
                            編集
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(event.eventId)}
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      {isModalOpen && editingEvent && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">イベント編集</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <EventScheduleForm
                  editingEvent={editingEvent}
                  onSave={async (updatedEvent) => {
                    await updateEvent(updatedEvent);
                    setIsModalOpen(false);
                    setEditingEvent(null);
                    // updateEvent メソッドがローカル状態を更新するため、fetchEvents は不要
                  }}
                  onCancel={() => {
                    setIsModalOpen(false);
                    setEditingEvent(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};