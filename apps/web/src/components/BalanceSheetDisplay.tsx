
// src/components/BalanceSheetDisplay.tsx

import React from 'react';
import { useFinancialStore } from '@asset-simulator/shared';

export const BalanceSheetDisplay: React.FC = () => {
  const { calculateBalanceSheet } = useFinancialStore();
  const bs = calculateBalanceSheet();

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
      <div className="card-header">貸借対照表 (BS)</div>
      <div className="card-body">
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
