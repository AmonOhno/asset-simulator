
// src/components/ProfitAndLossDisplay.tsx

import React from 'react';
import { useFinancialStore } from '@asset-simulator/shared';

export const ProfitAndLossDisplay: React.FC = () => {
  const { calculateProfitAndLossStatement } = useFinancialStore();
  const pl = calculateProfitAndLossStatement();

  const totalRevenues = pl.revenues.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = pl.expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="card h-100">
      <div className="card-header">損益計算書 (PL)</div>
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
