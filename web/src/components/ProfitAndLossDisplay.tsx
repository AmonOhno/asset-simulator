
// src/components/ProfitAndLossDisplay.tsx

import React, { useState } from 'react';
import { useFinancialStore } from '@asset-simulator/shared';
import { DateRangePicker, DateRange } from './DateRangePicker';

export const ProfitAndLossDisplay: React.FC = () => {
  const { calculateProfitAndLossStatement } = useFinancialStore();
  
  // デフォルトは今月
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const defaultStartDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const defaultEndDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: defaultStartDate,
    endDate: defaultEndDate
  });
  
  const pl = calculateProfitAndLossStatement(dateRange.startDate, dateRange.endDate);

  const totalRevenues = pl.revenues.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = pl.expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="card h-100">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <span>損益計算書 (PL)</span>
          <DateRangePicker 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="flex-shrink-0"
          />
        </div>
      </div>
      <div className="card-body">
        <table className="table table-sm">
          <tbody>
            <tr>
              <th colSpan={2} className="table-secondary">収益</th>
            </tr>
            {pl.revenues.length > 0 ? (
              pl.revenues.map((item, index) => (
                <tr key={index}>
                  <td>{item.accountName}</td>
                  <td className="text-end">{item.amount.toLocaleString()}円</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={2} className="text-muted">項目がありません</td></tr>
            )}
            <tr className="table-group-divider">
              <th>収益合計</th>
              <th className="text-end">{totalRevenues.toLocaleString()}円</th>
            </tr>

            <tr>
              <th colSpan={2} className="table-secondary">費用</th>
            </tr>
            {pl.expenses.length > 0 ? (
              pl.expenses.map((item, index) => (
                <tr key={index}>
                  <td>{item.accountName}</td>
                  <td className="text-end">{item.amount.toLocaleString()}円</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={2} className="text-muted">項目がありません</td></tr>
            )}
            <tr className="table-group-divider">
              <th>費用合計</th>
              <th className="text-end">{totalExpenses.toLocaleString()}円</th>
            </tr>

            <tr className="table-light">
              <th>当期純利益 (収益 - 費用)</th>
              <th className={`text-end ${pl.netIncome < 0 ? 'text-danger' : ''}`}>
                {pl.netIncome.toLocaleString()}円
              </th>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
