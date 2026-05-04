import { useMemo, useState } from "react";
import { Card, CardBodyHead, CardBodyMain } from "./components/Card";
import { DateInput } from "./components/DateInput";
import { CommonButton } from "./components/CommonButton";
import { DataGrid } from "./components/DataGrid";
import { sampleProfitLossRows } from "./data/financial";

export function ProfitLossStatementCard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-31");

  const grouped = useMemo(() => {
    const filtered = sampleProfitLossRows.filter(
      (row) => row.date >= startDate && row.date <= endDate
    );

    const summary: Record<string, { account: string; category: string; amount: number }> = {};
    filtered.forEach((item) => {
      const key = `${item.account}-${item.category}`;
      if (!summary[key]) {
        summary[key] = { account: item.account, category: item.category, amount: 0 };
      }
      summary[key].amount += item.amount;
    });

    return Object.values(summary);
  }, [startDate, endDate]);

  const revenueTotal = grouped
    .filter((row) => row.category === "Revenue")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseTotal = grouped
    .filter((row) => row.category === "Expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const profit = revenueTotal - expenseTotal;

  return (
    <Card
      title="損益計算書【PL】"
      subInfo={`${startDate} 〜 ${endDate}`}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <DateInput value={startDate} onChange={setStartDate} sizeVariant="S" />
          <span style={{ alignSelf: "center" }}>~</span>
          <DateInput value={endDate} onChange={setEndDate} sizeVariant="S" />
          <CommonButton label="期間反映" onClick={() => undefined} />
        </div>
      </CardBodyHead>
      <CardBodyMain>
        <DataGrid
          data={grouped}
          columns={[
            { label: "勘定科目", key: "account", width: 180 },
            { label: "区分", key: "category", width: 120, align: "center" },
            { label: "合計金額", key: "amount", width: 140, align: "right" },
          ]}
          colorVariant="gray"
        />
        <div
          style={{
            display: "grid",
            gap: 8,
            marginTop: 12,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>収益合計:</span>
            <span>¥{revenueTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>費用合計:</span>
            <span>¥{expenseTotal.toLocaleString()}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 8,
              borderTop: "1px solid #D1D5DB",
              color: profit >= 0 ? "#047857" : "#DC2626",
            }}
          >
            <span>当期純利益:</span>
            <span>¥{profit.toLocaleString()}</span>
          </div>
        </div>
      </CardBodyMain>
    </Card>
  );
}
