import React, { useState, useEffect, useCallback } from 'react';

export interface DateRange {
  startDate: string;
  endDate: string;
}

type HolidayAdjustment = 'none' | 'before' | 'after';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ 
  dateRange, 
  onDateRangeChange, 
  className = '' 
}) => {
  // 設定用ステート
  const [preset, setPreset] = useState<string>('1-month');
  const [startDayOfWeek, setStartDayOfWeek] = useState<number>(1); // 0:日, 1:月...
  const [startDayOfMonth, setStartDayOfMonth] = useState<number>(25);
  const [holidayAdj, setHolidayAdj] = useState<HolidayAdjustment>('before');
  const [startMonthDay, setStartMonthDay] = useState<{ m: number, d: number }>({ m: 12, d: 25 });

  // タイムゾーンのズレを防ぐフォーマット関数 (YYYY-MM-DD)
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 休日（土日）調整ロジック
  const adjustDate = useCallback((date: Date, adj: HolidayAdjustment): Date => {
    const result = new Date(date);
    if (adj === 'none') return result;

    const day = result.getDay();
    if (day === 0) { // 日曜日
      result.setDate(result.getDate() + (adj === 'after' ? 1 : -2));
    } else if (day === 6) { // 土曜日
      result.setDate(result.getDate() + (adj === 'after' ? 2 : -1));
    }
    return result;
  }, []);

  // 設定変更時に初期範囲を計算する関数
  const calculateInitialRange = useCallback(() => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case '1-week':
        const currentDay = today.getDay();
        const diff = (currentDay < startDayOfWeek ? 7 : 0) + currentDay - startDayOfWeek;
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diff);
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
        break;

      case '1-month':
        start = new Date(today.getFullYear(), today.getMonth(), startDayOfMonth);
        if (start > today) start.setMonth(start.getMonth() - 1);
        
        end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate() - 1);
        start = adjustDate(start, holidayAdj);
        end = adjustDate(end, holidayAdj);
        break;

      case '1-year':
        start = new Date(today.getFullYear(), startMonthDay.m - 1, startMonthDay.d);
        if (start > today) start.setFullYear(start.getFullYear() - 1);
        
        end = new Date(start.getFullYear() + 1, start.getMonth(), start.getDate() - 1);
        break;

      default:
        return;
    }

    onDateRangeChange({ 
      startDate: formatDate(start), 
      endDate: formatDate(end) 
    });
  }, [preset, startDayOfWeek, startDayOfMonth, holidayAdj, startMonthDay, adjustDate, onDateRangeChange]);

  // 矢印ボタンでの期間移動処理
  const handleOffset = (direction: 'prev' | 'next') => {
    const offset = direction === 'next' ? 1 : -1;
    const currentStart = new Date(dateRange.startDate);
    let newStart = new Date(currentStart);
    let newEnd = new Date();

    switch (preset) {
      case '1-week':
        newStart.setDate(currentStart.getDate() + (offset * 7));
        newEnd = new Date(newStart.getFullYear(), newStart.getMonth(), newStart.getDate() + 6);
        break;

      case '1-month':
        // 現在の月から相対的に移動し、開始日設定(startDayOfMonth)を再適用
        newStart = new Date(currentStart.getFullYear(), currentStart.getMonth() + offset, startDayOfMonth);
        newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, newStart.getDate() - 1);
        // 移動先でも休日調整を反映
        newStart = adjustDate(newStart, holidayAdj);
        newEnd = adjustDate(newEnd, holidayAdj);
        break;

      case '1-year':
        newStart.setFullYear(currentStart.getFullYear() + offset);
        newEnd = new Date(newStart.getFullYear() + 1, newStart.getMonth(), newStart.getDate() - 1);
        break;

      default:
        return;
    }

    onDateRangeChange({ 
      startDate: formatDate(newStart), 
      endDate: formatDate(newEnd) 
    });
  };

  // 設定項目が変更された時のみ初期計算を実行
  // 依存関係に dateRange を含めないことで、矢印ボタン操作時の上書きループを防ぐ
  useEffect(() => {
    if (preset !== 'custom') {
      calculateInitialRange();
    }
    // 依存関係から calculateInitialRange を外すことで、
    // 親から dateRange (Props) が降ってきても再計算ループが起きないようにする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, startDayOfWeek, startDayOfMonth, holidayAdj, startMonthDay]);

  return (
    <div className={`date-range-picker ${className}`}>
      <div className="row g-2 align-items-center">
        {/* 期間移動ボタン */}
        {preset !== 'custom' && (
          <div className="col-auto">
            <div className="btn-group btn-group-sm mb-1">
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={() => handleOffset('prev')}
                title="前の期間へ"
              >
                ←
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={() => handleOffset('next')}
                title="次の期間へ"
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* プリセット選択 */}
        <div className="col-auto">
          <select 
            className="form-select form-select-sm" 
            value={preset} 
            onChange={(e) => setPreset(e.target.value)}
          >
            <option value="custom">カスタム</option>
            <option value="1-week">1週間</option>
            <option value="1-month">1ヶ月</option>
            <option value="1-year">1年</option>
          </select>
        </div>

        {/* 1週間用：開始曜日 */}
        {preset === '1-week' && (
          <div className="col-auto">
            <select 
              className="form-select form-select-sm" 
              value={startDayOfWeek} 
              onChange={(e) => setStartDayOfWeek(Number(e.target.value))}
            >
              {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                <option key={i} value={i}>{d}曜日</option>
              ))}
            </select>
          </div>
        )}

        {/* 1ヶ月用：開始日と休日調整 */}
        {preset === '1-month' && (
          <>
            <div className="col-auto">
              <input 
                type="number" 
                className="form-control form-control-sm" 
                style={{ width: '55px' }} 
                min="1" 
                max="31" 
                value={startDayOfMonth} 
                onChange={(e) => setStartDayOfMonth(Number(e.target.value))} 
              />
            </div>
            <div className="col-auto">
              <select 
                className="form-select form-select-sm" 
                value={holidayAdj} 
                onChange={(e) => setHolidayAdj(e.target.value as HolidayAdjustment)}
              >
                <option value="none">休日ずらしなし</option>
                <option value="before">休日前倒し</option>
                <option value="after">休日後倒し</option>
              </select>
            </div>
          </>
        )}

        {/* 1年用：開始月日 */}
        {preset === '1-year' && (
          <div className="col-auto">
            <div className="d-flex gap-1 align-items-center">
              <input 
                type="number" 
                className="form-control form-control-sm" 
                style={{ width: '50px' }} 
                min="1" 
                max="12" 
                value={startMonthDay.m} 
                onChange={(e) => setStartMonthDay({ ...startMonthDay, m: Number(e.target.value) })} 
              />
              <span>/</span>
              <input 
                type="number" 
                className="form-control form-control-sm" 
                style={{ width: '50px' }} 
                min="1" 
                max="31" 
                value={startMonthDay.d} 
                onChange={(e) => setStartMonthDay({ ...startMonthDay, d: Number(e.target.value) })} 
              />
            </div>
          </div>
        )}

        {/* 日付表示/入力エリア */}
        <div className="col-auto d-flex align-items-center gap-2">
          <div className="d-flex align-items-center gap-1">
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateRange.startDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
              readOnly={preset !== 'custom'}
            />
            <span>〜</span>
            <input
              type="date"
              className="form-control form-control-sm"
              value={dateRange.endDate}
              onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
              readOnly={preset !== 'custom'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};