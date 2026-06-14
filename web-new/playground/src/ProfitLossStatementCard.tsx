import { useMemo, useState } from "react";
import type { ProfitLossView } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "../../src/components/Card";
import { DateInput } from "../../src/components/DateInput";
import { CommonButton } from "../../src/components/CommonButton";
import { DataGrid } from "../../src/components/DataGrid";

type Props = {
  appliedStartDate: string;
  appliedEndDate: string;
  rows: ProfitLossView[];
  onApply: (startDate: string, endDate: string) => void;
};

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getPeriodPresets() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();
  const q = Math.floor(mo / 3);
  return {
    thisMonth: [fmt(new Date(y, mo, 1)), fmt(new Date(y, mo + 1, 0))] as [string, string],
    lastMonth: [fmt(new Date(y, mo - 1, 1)), fmt(new Date(y, mo, 0))] as [string, string],
    thisQuarter: [fmt(new Date(y, q * 3, 1)), fmt(new Date(y, q * 3 + 3, 0))] as [string, string],
    thisYear: [`${y}-01-01`, `${y}-12-31`] as [string, string],
  };
}

export function ProfitLossStatementCard({ appliedStartDate, appliedEndDate, rows, onApply }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingStart, setPendingStart] = useState(appliedStartDate);
  const [pendingEnd, setPendingEnd] = useState(appliedEndDate);

  // サーバー集計済みの ProfitLossView を表示用の行へマッピング
  const grouped = useMemo(
    () => rows.map((row) => ({ account: row.name, category: row.category, amount: row.sumAmount })),
    [rows]
  );

  const revenueTotal = grouped
    .filter((row) => row.category === "Revenue")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseTotal = grouped
    .filter((row) => row.category === "Expense")
    .reduce((sum, item) => sum + item.amount, 0);

  const profit = revenueTotal - expenseTotal;

  const presets = getPeriodPresets();

  const applyPreset = (start: string, end: string) => {
    setPendingStart(start);
    setPendingEnd(end);
    onApply(start, end);
  };

  return (
    <Card
      title="損益計算書【PL】"
      subInfo={`${appliedStartDate} 〜 ${appliedEndDate}`}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <CommonButton label="今月" fontSize="S" sizeVariant="S" colorVariant="secondary" onClick={() => applyPreset(...presets.thisMonth)} />
            <CommonButton label="先月" fontSize="S" sizeVariant="S" colorVariant="secondary" onClick={() => applyPreset(...presets.lastMonth)} />
            <CommonButton label="3ヶ月" fontSize="S" sizeVariant="S" colorVariant="secondary" onClick={() => applyPreset(...presets.thisQuarter)} />
            <CommonButton label="今年" fontSize="S" sizeVariant="S" colorVariant="secondary" onClick={() => applyPreset(...presets.thisYear)} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <DateInput value={pendingStart} onChange={setPendingStart} sizeVariant="S" />
            <span style={{ alignSelf: "center", color: "#6B7280" }}>〜</span>
            <DateInput value={pendingEnd} onChange={setPendingEnd} sizeVariant="S" />
            <CommonButton label="期間反映" onClick={() => onApply(pendingStart, pendingEnd)} />
          </div>
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
