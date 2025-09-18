import React, { useState } from 'react';
import { useFinancialStore } from '@asset-simulator/shared';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';

export const Dashboard: React.FC = () => {
  const { calculateBalanceSheet, calculateProfitAndLossStatement } = useFinancialStore();
  
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
  
  const [bsAsOfDate, setBsAsOfDate] = useState<string>(defaultEndDate);
  
  const bs = calculateBalanceSheet(bsAsOfDate);
  const pl = calculateProfitAndLossStatement(dateRange.startDate, dateRange.endDate);
  
  const totalRevenues = pl.revenues.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = pl.expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="dashboard">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">財務ダッシュボード</h2>
        </div>
      </div>
      
      {/* サマリーカード */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">総資産</h5>
              <h3 className="card-text">{bs.totalAssets.toLocaleString()}円</h3>
              <small>基準日: {bsAsOfDate}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">収益</h5>
              <h3 className="card-text">{totalRevenues.toLocaleString()}円</h3>
              <small>{dateRange.startDate} 〜 {dateRange.endDate}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h5 className="card-title">費用</h5>
              <h3 className="card-text">{totalExpenses.toLocaleString()}円</h3>
              <small>{dateRange.startDate} 〜 {dateRange.endDate}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className={`card text-white ${pl.netIncome >= 0 ? 'bg-info' : 'bg-danger'}`}>
            <div className="card-body">
              <h5 className="card-title">純損益</h5>
              <h3 className="card-text">{pl.netIncome.toLocaleString()}円</h3>
              <small>{dateRange.startDate} 〜 {dateRange.endDate}</small>
            </div>
          </div>
        </div>
      </div>

      {/* 期間フィルタ */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">期間設定</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">貸借対照表の基準日</label>
                  <input
                    type="date"
                    className="form-control"
                    value={bsAsOfDate}
                    onChange={(e) => setBsAsOfDate(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">損益計算書の期間</label>
                  <DateRangePicker 
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 財務レポート */}
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">貸借対照表 (BS)</h5>
              <small className="text-muted">基準日: {bsAsOfDate}</small>
            </div>
            <div className="card-body">
              <table className="table table-sm">
                <tbody>
                  <tr>
                    <th colSpan={2} className="table-secondary">資産</th>
                  </tr>
                  {bs.assets.length > 0 ? (
                    bs.assets.map((item, index) => (
                      <tr key={index}>
                        <td>{item.accountName}</td>
                        <td className="text-end">{item.amount.toLocaleString()}円</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="text-muted">項目がありません</td></tr>
                  )}
                  <tr className="table-group-divider">
                    <th>資産合計</th>
                    <th className="text-end">{bs.totalAssets.toLocaleString()}円</th>
                  </tr>
                  <tr>
                    <th colSpan={2} className="table-secondary">負債</th>
                  </tr>
                  {bs.liabilities.length > 0 ? (
                    bs.liabilities.map((item, index) => (
                      <tr key={index}>
                        <td>{item.accountName}</td>
                        <td className="text-end">{item.amount.toLocaleString()}円</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="text-muted">項目がありません</td></tr>
                  )}
                  <tr>
                    <th colSpan={2} className="table-secondary">純資産</th>
                  </tr>
                  {bs.equity.length > 0 ? (
                    bs.equity.map((item, index) => (
                      <tr key={index}>
                        <td>{item.accountName}</td>
                        <td className="text-end">{item.amount.toLocaleString()}円</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="text-muted">項目がありません</td></tr>
                  )}
                  <tr className="table-group-divider">
                    <th>負債・純資産合計</th>
                    <th className="text-end">{bs.totalLiabilitiesAndEquity.toLocaleString()}円</th>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">損益計算書 (PL)</h5>
              <small className="text-muted">{dateRange.startDate} 〜 {dateRange.endDate}</small>
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
                    <th>当期純利益</th>
                    <th className={`text-end ${pl.netIncome < 0 ? 'text-danger' : 'text-success'}`}>
                      {pl.netIncome.toLocaleString()}円
                    </th>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
