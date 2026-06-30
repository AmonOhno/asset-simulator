import { useMemo, useState } from "react";
import type { ProfitLossView } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "@mobile-components/Card";
import { PeriodSelector } from "@mobile-components/PeriodSelector";
import { DataGrid } from "@mobile-components/DataGrid";

type Props = {
  appliedStartDate: string;
  appliedEndDate: string;
  rows: ProfitLossView[];
  onApply: (startDate: string, endDate: string) => void;
};

// 区分の表示順（損益計算書: 収益→費用）
const CATEGORY_ORDER: Record<string, number> = { Revenue: 0, Expense: 1 };

export function ProfitLossStatementCard({ appliedStartDate, appliedEndDate, rows, onApply }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // サーバー集計済みの ProfitLossView を表示用の行へマッピング（区分→勘定科目でソート）
  const grouped = useMemo(
    () =>
      rows
        .map((row) => ({ account: row.name, category: row.category, amount: row.sumAmount }))
        .sort(
          (a, b) =>
            (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99) ||
            a.account.localeCompare(b.account, "ja")
        ),
    [rows]
  );

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
      subInfo={`${appliedStartDate} 〜 ${appliedEndDate}`}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
        <PeriodSelector
          range={{ startDate: appliedStartDate, endDate: appliedEndDate }}
          onChange={(r) => onApply(r.startDate, r.endDate)}
        />
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
