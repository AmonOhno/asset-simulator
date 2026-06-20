import React, { useState, useEffect } from 'react';
import { useFinancialStore, useAuthStore, BalanceSheetView, ProfitLossView } from '@asset-simulator/shared';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';

export const JournalDashboard: React.FC = () => {
  const { getBalanceSheetView, getProfitLossStatementView } = useFinancialStore();
  const { userId } = useAuthStore();
    
  const getInitialRange = (): DateRange => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // ヘルパーを使い回すか、ここでも同様のフォーマット処理を行う
    const f = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return {
      startDate: f(startDate),
      endDate: f(endDate)
    };
  };

  const defaultRange = getInitialRange();
  
const getStoredDateRange = (): DateRange => {
    if (!userId) return defaultRange;
    const key = `JournalDashboard-date-range_${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return defaultRange;
      }
    }
    return defaultRange;
  };

  const getStoredBsAsOfDate = (plEndDate?: string): string => {
    if (!userId) return plEndDate || defaultRange.endDate;
    const key = `JournalDashboard-bs-as-of-date_${userId}`;
    const stored = localStorage.getItem(key);
    return stored || plEndDate || defaultRange.endDate;
  };
  
  const initialDateRange = getStoredDateRange();
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange);
  const [bsAsOfDate, setBsAsOfDate] = useState<string>(getStoredBsAsOfDate(initialDateRange.endDate));
  const [bsData, setBsData] = useState<BalanceSheetView[]>([]);
  const [plData, setPlData] = useState<ProfitLossView[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`JournalDashboard-date-range_${userId}`, JSON.stringify(dateRange));
    }
  }, [dateRange, userId]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`JournalDashboard-bs-as-of-date_${userId}`, bsAsOfDate);
    }
  }, [bsAsOfDate, userId]);

  const handleDateRangeChange = (newDateRange: DateRange) => {
    // 現在の値と同じなら更新しない（不要なレンダリング防止）
    setDateRange(prev => {
      if (prev.startDate === newDateRange.startDate && prev.endDate === newDateRange.endDate) {
        return prev;
      }
      return newDateRange;
    });
    
    // BSの基準日を更新
    setBsAsOfDate(prev => prev === newDateRange.endDate ? prev : newDateRange.endDate);
  };
  
  const handleBsAsOfDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBsAsOfDate = e.target.value;
    
    if (newBsAsOfDate !== bsAsOfDate) {
      setBsAsOfDate(newBsAsOfDate);
      // PLの終了日も合わせる
      setDateRange(prev => ({
        ...prev,
        endDate: newBsAsOfDate
      }));
    }
  };

  // サーバーVIEWからBS・PLデータを取得
  const lastFetchKey = React.useRef<string>('');
  useEffect(() => {
    const key = `${bsAsOfDate}|${dateRange.startDate}|${dateRange.endDate}`;
    if (lastFetchKey.current === key) {
      // 既に同じ期間で取得済み（StrictMode等で効果が2回呼ばれた場合の二重防止）
      return;
    }
    lastFetchKey.current = key;

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

  const groupByCategory = (rows: BalanceSheetView[] | ProfitLossView[]): Record<string, number> => {
    const grouped: Record<string, number> = {};
    rows.forEach(row => {
      grouped[row.category] = (grouped[row.category] || 0) + (row.sumAmount || 0);
    });
    return grouped;
  };

  const getDetailsByCategory = (rows: BalanceSheetView[] | ProfitLossView[], category: string) => {
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
    <div className="JournalDashboard">
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
          <div className={`card text-white ${netIncome >= 0 ? 'bg-info' : 'bg-warning'}`}>
            <div className="card-body">
              <h5 className="card-title">純損益</h5>
              <h3 className="card-text">{netIncome.toLocaleString()}円</h3>
              <small>{dateRange.startDate} 〜 {dateRange.endDate}</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className={`card text-white ${totalEquity_Value >= 0 ? 'bg-primary' : 'bg-danger'}`}>
            <div className="card-body">
              <h5 className="card-title">総資産</h5>
              <h3 className="card-text">{totalEquity_Value.toLocaleString()}円</h3>
              <small>基準日: {bsAsOfDate}</small>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">損益計算書 (PL)</h5>
              <small className="text-muted">{dateRange.startDate} 〜 {dateRange.endDate}</small>
            </div>
            <div className="card-body">
              <div className="col-md-12 mb-3">
                <DateRangePicker 
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  className=''
                />
              </div>
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

        <div className="col-lg-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">貸借対照表 (BS)</h5>
              <small className="text-muted">基準日: {bsAsOfDate}</small>
            </div>
            <div className="card-body">
              <div className="date-range-picker mb-3">
                <div className="row g-2 align-items-center">
                  <div className="col-auto">
                    <label className="form-label mb-0">基準日:</label>
                  </div>
                  <div className="col-auto">
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={bsAsOfDate}
                      onChange={handleBsAsOfDateChange}
                      // 既存の col-md-4 や mb-3 はグリッド外に移動、または削除
                    />
                  </div>
                </div>
              </div>
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
      </div>
    </div>
  );
};
