import { useMemo, useState } from "react";
import { Card, CardBodyHead, CardBodyMain } from "./components/Card";
import { DateInput } from "./components/DateInput";
import { CommonButton } from "./components/CommonButton";
import { DataGrid } from "./components/DataGrid";

interface BalanceSheetRow {
  account: string;
  category: string;
  amount: number;
  date: string;
}

const sampleBalanceSheetRows: BalanceSheetRow[] = [
  { account: "現金", category: "Asset", amount: 260000, date: "2026-05-31" },
  { account: "売掛金", category: "Asset", amount: 180000, date: "2026-05-31" },
  { account: "買掛金", category: "Liability", amount: 150000, date: "2026-05-31" },
  { account: "未払費用", category: "Liability", amount: 32000, date: "2026-05-31" },
  { account: "資本金", category: "Liability", amount: 260000, date: "2026-05-31" },
];

export function BalanceSheetCard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [asOfDate, setAsOfDate] = useState("2026-05-31");

  const grouped = useMemo(() => {
    const filtered = sampleBalanceSheetRows.filter((row) => row.date === asOfDate);

    const summary: Record<string, { account: string; category: string; amount: number }> = {};
    filtered.forEach((item) => {
      if (!summary[item.account]) {
        summary[item.account] = { account: item.account, category: item.category, amount: 0 };
      }
      summary[item.account].amount += item.amount;
    });

    return Object.values(summary);
  }, [asOfDate]);

  const assetsTotal = grouped
    .filter((row) => row.category === "Asset")
    .reduce((sum, item) => sum + item.amount, 0);
  const liabilityTotal = grouped
    .filter((row) => row.category === "Liability")
    .reduce((sum, item) => sum + item.amount, 0);
  const summeryTotal = assetsTotal - liabilityTotal;

  return (
    <Card
      title="貸借対照表【BS】画面"
      subInfo={asOfDate}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <DateInput value={asOfDate} onChange={setAsOfDate} sizeVariant="M" />
          <CommonButton label="基準日反映" onClick={() => undefined} />
        </div>
      </CardBodyHead>
      <CardBodyMain>
        <DataGrid
          data={grouped}
          columns={[
            { label: "勘定科目", key: "account", width: 180 },
            { label: "区分", key: "category", width: 120, align: "center" },
            { label: "残高", key: "amount", width: 140, align: "right" },
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
            <span>資産合計:</span>
            <span>¥{assetsTotal.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>負債・純資産合計:</span>
            <span>¥{liabilityTotal.toLocaleString()}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 8,
              borderTop: "1px solid #D1D5DB",
              color: summeryTotal >= 0 ? "#047857" : "#DC2626",
            }}
          >
            <span>純資産合計:</span>
            <span>¥{summeryTotal.toLocaleString()}</span>
          </div>
        </div>
      </CardBodyMain>
    </Card>
  );
}
