import React, { useState, useEffect } from 'react';
import { useEventsStore, ScheduleEvent } from '@asset-simulator/shared';

export const EventScheduleManager: React.FC = () => {
  const { events, fetchEvents, updateEvent, deleteEvent } = useEventsStore();
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
        // 削除後にデータを再取得
        await fetchEvents();
        console.log('データ再取得完了');
        alert('イベントを削除しました');
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert(`削除に失敗しました: ${error}`);
      }
    }
  };

  const handleSave = async () => {
    if (editingEvent) {
      await updateEvent(editingEvent);
      setIsModalOpen(false);
      setEditingEvent(null);
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
                <form>
                  <div className="mb-3">
                    <label className="form-label">タイトル</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={editingEvent.allDayFlg}
                        onChange={(e) => setEditingEvent({...editingEvent, allDayFlg: e.target.checked})}
                      />
                      <label className="form-check-label">終日</label>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">開始日</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editingEvent.startDate}
                          onChange={(e) => setEditingEvent({...editingEvent, startDate: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">終了日</label>
                        <input
                          type="date"
                          className="form-control"
                          value={editingEvent.endDate}
                          onChange={(e) => setEditingEvent({...editingEvent, endDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  {!editingEvent.allDayFlg && (
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">開始時間</label>
                          <input
                            type="time"
                            className="form-control"
                            value={editingEvent.startTime || ''}
                            onChange={(e) => setEditingEvent({...editingEvent, startTime: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label">終了時間</label>
                          <input
                            type="time"
                            className="form-control"
                            value={editingEvent.endTime || ''}
                            onChange={(e) => setEditingEvent({...editingEvent, endTime: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">説明</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editingEvent.description || ''}
                      onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};