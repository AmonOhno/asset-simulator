import React from 'react';

export interface DateRange {
  startDate: string;
  endDate: string;
}

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
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      ...dateRange,
      startDate: e.target.value
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange({
      ...dateRange,
      endDate: e.target.value
    });
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    let startDate: string;
    let endDate: string;

    switch (preset) {
      case 'current-month':
        startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
        endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
        break;
      case 'last-month':
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        startDate = `${lastMonthYear}-${String(lastMonth + 1).padStart(2, '0')}-01`;
        endDate = new Date(lastMonthYear, lastMonth + 1, 0).toISOString().split('T')[0];
        break;
      case 'current-year':
        startDate = `${currentYear}-01-01`;
        endDate = `${currentYear}-12-31`;
        break;
      case 'last-year':
        startDate = `${currentYear - 1}-01-01`;
        endDate = `${currentYear - 1}-12-31`;
        break;
      case 'last-30-days':
        endDate = today.toISOString().split('T')[0];
        const start30Days = new Date(today);
        start30Days.setDate(start30Days.getDate() - 30);
        startDate = start30Days.toISOString().split('T')[0];
        break;
      case 'last-90-days':
        endDate = today.toISOString().split('T')[0];
        const start90Days = new Date(today);
        start90Days.setDate(start90Days.getDate() - 90);
        startDate = start90Days.toISOString().split('T')[0];
        break;
      default:
        return; // カスタム範囲の場合は何もしない
    }

    onDateRangeChange({ startDate, endDate });
  };

  return (
    <div className={`date-range-picker ${className}`}>
      <div className="row g-2 align-items-center">
        <div className="col-auto">
          <label className="form-label mb-0">期間:</label>
        </div>
        <div className="col-auto">
          <select 
            className="form-select form-select-sm"
            onChange={handlePresetChange}
            defaultValue=""
          >
            <option value="">カスタム期間</option>
            <option value="current-month">今月</option>
            <option value="last-month">先月</option>
            <option value="current-year">今年</option>
            <option value="last-year">昨年</option>
            <option value="last-30-days">過去30日</option>
            <option value="last-90-days">過去90日</option>
          </select>
        </div>
        <div className="col-auto">
          <input
            type="date"
            className="form-control form-control-sm"
            value={dateRange.startDate}
            onChange={handleStartDateChange}
            max={dateRange.endDate}
          />
        </div>
        <div className="col-auto">
          <span>〜</span>
        </div>
        <div className="col-auto">
          <input
            type="date"
            className="form-control form-control-sm"
            value={dateRange.endDate}
            onChange={handleEndDateChange}
            min={dateRange.startDate}
          />
        </div>
      </div>
    </div>
  );
};
