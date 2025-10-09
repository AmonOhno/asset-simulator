
// src/components/BalanceSheetDisplay.tsx

import React, { useState, useEffect } from 'react';
import { useFinancialStore, useAuthStore } from '@asset-simulator/shared';

export const BalanceSheetDisplay: React.FC = () => {
  const { calculateBalanceSheet } = useFinancialStore();
  const { userId } = useAuthStore();
  
  // デフォルトは今日の日付
  const today = new Date().toISOString().split('T')[0];
  
  const getStoredAsOfDate = (): string => {
    if (!userId) return today;
    const key = `balanceSheet-asOfDate_${userId}`;
    return localStorage.getItem(key) || today;
  };
  
  const [asOfDate, setAsOfDate] = useState<string>(getStoredAsOfDate);
  
  // 基準日が変更された時にlocalStorageに保存
  useEffect(() => {
    if (userId) {
      const key = `balanceSheet-asOfDate_${userId}`;
      localStorage.setItem(key, asOfDate);
    }
  }, [asOfDate, userId]);
  
  const bs = calculateBalanceSheet(asOfDate);

  const handleAsOfDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAsOfDate(e.target.value);
  };

  const renderSection = (title: string, items: { accountName: string; amount: number }[]) => (
    <>
      <tr>
        <th colSpan={2} className="table-secondary">{title}</th>
      </tr>
      {items.length > 0 ? (
        items.map((item, index) => (
          <tr key={index}>
            <td>{item.accountName}</td>
            <td className="text-end">{item.amount.toLocaleString()}円</td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={2} className="text-muted">項目がありません</td>
        </tr>
      )}
    </>
  );

  return (
    <div className="card h-100">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <span>貸借対照表 (BS)</span>
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 small">基準日:</label>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: '140px' }}
              value={asOfDate}
              onChange={handleAsOfDateChange}
            />
          </div>
        </div>
      </div>
      <div className="card-body card-body-scrollable">
        <table className="table table-sm">
          <tbody>
            {renderSection('資産', bs.assets)}
            <tr className="table-group-divider">
              <th >資産合計</th>
              <th className="text-end">{bs.totalAssets.toLocaleString()}円</th>
            </tr>
            {renderSection('負債', bs.liabilities)}
            {renderSection('純資産', bs.equity)}
            <tr className="table-group-divider">
              <th>負債・純資産合計</th>
              <th className="text-end">{bs.totalLiabilitiesAndEquity.toLocaleString()}円</th>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
