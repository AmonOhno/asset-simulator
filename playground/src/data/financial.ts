export interface ProfitLossRow {
  account: string;
  category: string;
  amount: number;
  date: string;
}

export interface BalanceSheetRow {
  account: string;
  category: string;
  amount: number;
  date: string;
}

export interface TransactionRow {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
}

export const sampleProfitLossRows: ProfitLossRow[] = [
  { account: "売上", category: "Revenue", amount: 320000, date: "2026-05-01" },
  { account: "売上", category: "Revenue", amount: 170000, date: "2026-05-10" },
  { account: "人件費", category: "Expense", amount: 120000, date: "2026-05-02" },
  { account: "家賃", category: "Expense", amount: 60000, date: "2026-05-05" },
  { account: "通信費", category: "Expense", amount: 12000, date: "2026-05-07" },
];

export const sampleBalanceSheetRows: BalanceSheetRow[] = [
  { account: "現金", category: "Asset", amount: 260000, date: "2026-05-31" },
  { account: "売掛金", category: "Asset", amount: 180000, date: "2026-05-31" },
  { account: "買掛金", category: "Liability", amount: 150000, date: "2026-05-31" },
  { account: "未払費用", category: "Liability", amount: 32000, date: "2026-05-31" },
  { account: "資本金", category: "Liability", amount: 260000, date: "2026-05-31" },
];

export const sampleTransactionRows: TransactionRow[] = [
  { id: "1", date: "2026-05-01", description: "売上計上", debitAccount: "Cash", creditAccount: "Sales", amount: 320000 },
  { id: "2", date: "2026-05-02", description: "給与支払", debitAccount: "Salary Expense", creditAccount: "Cash", amount: 120000 },
  { id: "3", date: "2026-05-05", description: "家賃支払", debitAccount: "Rent Expense", creditAccount: "Cash", amount: 60000 },
  { id: "4", date: "2026-05-07", description: "通信費支払", debitAccount: "Utilities", creditAccount: "Cash", amount: 12000 },
  { id: "5", date: "2026-05-10", description: "仕入れ", debitAccount: "Inventory", creditAccount: "Accounts Payable", amount: 170000 },
  { id: "6", date: "2026-05-15", description: "売上計上", debitAccount: "Cash", creditAccount: "Sales", amount: 150000 },
  { id: "7", date: "2026-05-20", description: "広告費支払", debitAccount: "Advertising Expense", creditAccount: "Cash", amount: 25000 },
  { id: "8", date: "2026-05-25", description: "売上計上", debitAccount: "Cash", creditAccount: "Sales", amount: 200000 },
  { id: "9", date: "2026-05-28", description: "雑費支払", debitAccount: "Miscellaneous Expense", creditAccount: "Cash", amount: 8000 },
];

export function calculateProfit(startDate: string, endDate: string) {
  const filtered = sampleProfitLossRows.filter(
    (row) => row.date >= startDate && row.date <= endDate
  );

  const revenueTotal = filtered
    .filter((row) => row.category === "Revenue")
    .reduce((sum, row) => sum + row.amount, 0);

  const expenseTotal = filtered
    .filter((row) => row.category === "Expense")
    .reduce((sum, row) => sum + row.amount, 0);

  return {
    revenueTotal,
    expenseTotal,
    profit: revenueTotal - expenseTotal,
  };
}

export function calculateNetAssets(asOfDate: string) {
  const filtered = sampleBalanceSheetRows.filter((row) => row.date === asOfDate);

  const assetsTotal = filtered
    .filter((row) => row.category === "Asset")
    .reduce((sum, row) => sum + row.amount, 0);
  const liabilityTotal = filtered
    .filter((row) => row.category === "Liability")
    .reduce((sum, row) => sum + row.amount, 0);

  return {
    assetsTotal,
    liabilityTotal,
    netAssets: assetsTotal - liabilityTotal,
  };
}

export function getTransactionsForDate(date: string) {
  return sampleTransactionRows.filter((row) => row.date === date);
}