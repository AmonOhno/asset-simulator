import React, { useState, useEffect, useCallback } from 'react';
import {
  computePeriodRange,
  shiftPeriodRange,
} from '@asset-simulator/shared';
import type { PeriodPreset, PeriodRange, PeriodSettings } from '@asset-simulator/shared';

export type DateRange = PeriodRange;

type HolidayAdjustment = 'none' | 'before' | 'after';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  className?: string;
}

// UI 上のプリセット値 ('1-week' 等) と shared の PeriodPreset ('week' 等) の対応
const PRESET_MAP: Record<string, PeriodPreset> = {
  '1-week': 'week',
  '1-month': 'month',
  '1-year': 'year',
  'custom': 'custom',
};

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

  const buildSettings = useCallback((): PeriodSettings => ({
    startDayOfWeek,
    startDayOfMonth,
    holidayAdjustment: holidayAdj,
    startMonth: startMonthDay.m,
    startMonthDay: startMonthDay.d,
  }), [startDayOfWeek, startDayOfMonth, holidayAdj, startMonthDay]);

  // 設定変更時に初期範囲を計算する関数
  const calculateInitialRange = useCallback(() => {
    const mappedPreset = PRESET_MAP[preset];
    const range = computePeriodRange(mappedPreset, buildSettings());
    if (range) {
      onDateRangeChange(range);
    }
  }, [preset, buildSettings, onDateRangeChange]);

  // 矢印ボタンでの期間移動処理
  const handleOffset = (direction: 'prev' | 'next') => {
    const mappedPreset = PRESET_MAP[preset];
    const range = shiftPeriodRange(mappedPreset, buildSettings(), dateRange, direction);
    if (range) {
      onDateRangeChange(range);
    }
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