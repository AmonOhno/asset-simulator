import React, { useState, useEffect } from 'react';
import { useFinancialStore, useAuthStore, BalanceSheetViewRow, ProfitLossViewRow } from '@asset-simulator/shared';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';

export const Dashboard: React.FC = () => {
  const { getBalanceSheetView, getProfitLossStatementView } = useFinancialStore();
  const { userId } = useAuthStore();
  
  // デフォルトは今月
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const defaultStartDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const defaultEndDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
  
  const getStoredDateRange = (): DateRange => {
    if (!userId) return { startDate: defaultStartDate, endDate: defaultEndDate };
    const key = `dashboard-date-range_${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { startDate: defaultStartDate, endDate: defaultEndDate };
      }
    }
    return { startDate: defaultStartDate, endDate: defaultEndDate };
  };

  const getStoredBsAsOfDate = (plEndDate?: string): string => {
    if (!userId) return plEndDate || defaultEndDate;
    const key = `dashboard-bs-as-of-date_${userId}`;
    const stored = localStorage.getItem(key);
    return stored || plEndDate || defaultEndDate;
  };
  
  const initialDateRange = getStoredDateRange();
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [bsAsOfDate, setBsAsOfDate] = useState<string>(getStoredBsAsOfDate(initialDateRange.endDate));
  const [bsData, setBsData] = useState<BalanceSheetViewRow[]>([]);
  const [plData, setPlData] = useState<ProfitLossViewRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`dashboard-date-range_${userId}`, JSON.stringify(dateRange));
    }
  }, [dateRange, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`dashboard-bs-as-of-date_${userId}`, bsAsOfDate);
    }
  }, [bsAsOfDate, userId]);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    if (!isSyncing) {
      setIsSyncing(true);
      setDateRange(newDateRange);
      setBsAsOfDate(newDateRange.endDate);
      setTimeout(() => setIsSyncing(false), 0);
    }
  };

  // サーバーVIEWからBS・PLデータを取得
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [bsRows, plRows] = await Promise.all([
          getBalanceSheetView(bsAsOfDate),
          getProfitLossStatementView(dateRange.startDate, dateRange.endDate)
        ]);
        setBsData(bsRows);
        setPlData(plRows);
      } catch (error) {
        console.error('Error fetching financial views:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [getBalanceSheetView, getProfitLossStatementView, bsAsOfDate, dateRange]);

  const groupByCategory = (rows: BalanceSheetViewRow[] | ProfitLossViewRow[]): Record<string, number> => {
    const grouped: Record<string, number> = {};
    rows.forEach(row => {
      grouped[row.category] = (grouped[row.category] || 0) + (row.sumAmount || 0);
    });
    return grouped;
  };

  const getDetailsByCategory = (rows: BalanceSheetViewRow[] | ProfitLossViewRow[], category: string) => {
    return rows.filter(row => row.category === category);
  };

  const bsCategorized = groupByCategory(bsData);
  const plCategorized = groupByCategory(plData);
  
  const totalAssets = bsCategorized['Asset'] || 0;
  const totalLiabilities = bsCategorized['Liability'] || 0;
  const totalEquity_Value = totalAssets - totalLiabilities;

  const assetDetails = getDetailsByCategory(bsData, 'Asset');
  const liabilityDetails = getDetailsByCategory(bsData, 'Liability');
  const equityDetails = getDetailsByCategory(bsData, 'Equity');
  
  const totalRevenues = plCategorized['Revenue'] || 0;
  const totalExpenses = plCategorized['Expense'] || 0;
  const netIncome = totalRevenues - totalExpenses;
  
  const revenueDetails = getDetailsByCategory(plData, 'Revenue');
  const expenseDetails = getDetailsByCategory(plData, 'Expense');

  return (
    <div className="dashboard">
      <div className="row">
        <div className="col-3">
          <h2 className="mb-4">財務ダッシュボード</h2>
        </div>
        {isLoading && (
          <div className="col-2">
            <div>読み込み中...</div>
          </div>
        )}
      </div>
      
      
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className={`card text-white ${totalEquity_Value >= 0 ? 'bg-primary' : 'bg-danger'}`}>
            <div className="card-body">
              <h5 className="card-title">総資産</h5>
              <h3 className="card-text">{totalEquity_Value.toLocaleString()}円</h3>
              <small>基準日: {bsAsOfDate}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className={`card text-white ${netIncome >= 0 ? 'bg-info' : 'bg-warning'}`}>
            <div className="card-body">
              <h5 className="card-title">純損益</h5>
              <h3 className="card-text">{netIncome.toLocaleString()}円</h3>
              <small>{dateRange.startDate} 〜 {dateRange.endDate}</small>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-6 mb-3">
        <label className="form-label">損益計算書の期間</label>
        <DateRangePicker 
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />
      </div>
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
                  {assetDetails.length > 0 ? (
                    assetDetails.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-end">{item.sumAmount.toLocaleString()}円</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="text-muted">項目がありません</td></tr>
                  )}
                  <tr className="table-group-divider">
                    <th>資産合計</th>
                    <th className="text-end">{totalAssets.toLocaleString()}円</th>
                  </tr>
                  <tr>
                    <th colSpan={2} className="table-secondary">負債</th>
                  </tr>
                  {liabilityDetails.length > 0 ? (
                    liabilityDetails.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-end">{item.sumAmount.toLocaleString()}円</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="text-muted">項目がありません</td></tr>
                  )}
                  <tr>
                    <th colSpan={2} className="table-secondary">純資産</th>
                  </tr>
                  {equityDetails.length > 0 ? (
                    equityDetails.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-end">{item.sumAmount.toLocaleString()}円</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="text-muted">項目がありません</td></tr>
                  )}
                  <tr className="table-group-divider">
                    <th>負債・純資産合計</th>
                    <th className="text-end">{(totalLiabilities + (bsCategorized['Equity'] || 0)).toLocaleString()}円</th>
                  </tr>
                  <tr className="table-dark">
                    <th>総資産</th>
                    <th className="text-end">{(totalEquity_Value).toLocaleString()}円</th>
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
                  {revenueDetails.length > 0 ? (
                    revenueDetails.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-end">{item.sumAmount.toLocaleString()}円</td>
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
                  {expenseDetails.length > 0 ? (
                    expenseDetails.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-end">{item.sumAmount.toLocaleString()}円</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={2} className="text-muted">項目がありません</td></tr>
                  )}
                  <tr className="table-group-divider">
                    <th>費用合計</th>
                    <th className="text-end">{totalExpenses.toLocaleString()}円</th>
                  </tr>
                  <tr className="table-dark">
                    <th>純損益</th>
                    <th className="text-end">{netIncome.toLocaleString()}円</th>
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
