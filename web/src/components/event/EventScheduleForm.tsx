import React, { useState } from 'react';
import { useEventsStore } from '@asset-simulator/shared';

export const EventScheduleForm: React.FC = () => {
  const { addEvent } = useEventsStore();
  const [title, setTitle] = useState('');
  const [allDayFlg, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setTitle('');
    setAllDay(false);
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     // バリデーション
    if (!title || !startDate || !endDate) {
      alert('`必須項目を入力してください。');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert('開始日は終了日より前である必要があります。');
      return;
    }
    if (title.length > 100) {
        alert('タイトルは100文字以内である必要があります。');
        return;
    }
    if (!allDayFlg && (!startTime || !endTime)) {
      alert('終日イベントには開始時間と終了時間の設定ができません。');
      return;
    }
    if (allDayFlg && (startTime || endTime)) {
      alert('時間指定のイベントには開始時間と終了時間が必要です。');
      return;
    }
    // データ送信処理
    const event = {
      title,
      allDayFlg,
      startDate,
      startTime,
      endDate,
      endTime,
      description,
      userId: ''
    };
    addEvent(event);
    resetForm();
  };

  return (
      <div className="card">
        <div className="card-header">イベント入力</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">イベント名:</label>
              <div className="col-md-8">
                <input 
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={100} required
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">終日:</label>
              <div className="col-md-4">
                <input 
                  type="checkbox"
                  className="form-check-input"
                  checked={allDayFlg}
                  onChange={e => setAllDay(e.target.checked)}
                />
              </div>
            </div>
            <div className="mb-3">
                <label className="form-label">開始日:</label>
                <div className="col-md-6">
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>
            </div>
            <div className="mb-3">
              <label className="form-label">終了日:</label>
              <div className="col-md-6">
                <input
                  type="date"
                  className="form-control"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
                  />
                </div>
            </div>
            {!allDayFlg && (
              <div className="mb-3">
                <label className="form-label">開始時間:</label>
                <div className="col-md-4">
                  <input
                    type="time"
                    className="form-control"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            {!allDayFlg && (
              <div className="mb-3">
                <label className="form-label">終了時間:</label>
                <div className="col-md-4">
                  <input
                    type="time"
                    className="form-control"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div className="mb-3">
              <label className="form-label">説明:</label>
              <div className="col-md-8">
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>
          <button type="submit" className='btn btn-primary'>登録</button>
        </form>
      </div>
    </div>
  );
};
