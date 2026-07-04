import { useMemo, type CSSProperties } from "react";
import type { ProfitLossView } from "@asset-simulator/shared";
import { PeriodSelector } from "@mobile-components/PeriodSelector";
import { DataGrid } from "@mobile-components/DataGrid";
import type { PeriodPreset, PeriodSettings } from "@mobile-components/periodSelector.utils";

type Props = {
  appliedStartDate: string;
  appliedEndDate: string;
  rows: ProfitLossView[];
  onApply: (startDate: string, endDate: string) => void;
  preset: PeriodPreset;
  onPresetChange: (preset: PeriodPreset) => void;
  settings: PeriodSettings;
  onSettingsChange: (settings: PeriodSettings) => void;
};

// 区分の表示順（損益計算書: 収益→費用）
const CATEGORY_ORDER: Record<string, number> = { Revenue: 0, Expense: 1 };

const container: CSSProperties = {
  width: "100%",
  maxWidth: 358,
  borderRadius: 12,
  background: "#FFFFFF",
  boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
  boxSizing: "border-box",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

// 収益・費用サマリーリスト（純利益パネル配下に表示される明細）
export function ProfitLossStatementCard({
  appliedStartDate,
  appliedEndDate,
  rows,
  onApply,
  preset,
  onPresetChange,
  settings,
  onSettingsChange,
}: Props) {
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
    <div style={container}>
      <PeriodSelector
        range={{ startDate: appliedStartDate, endDate: appliedEndDate }}
        onChange={(r) => onApply(r.startDate, r.endDate)}
        preset={preset}
        onPresetChange={onPresetChange}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
      <div>
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
      </div>
    </div>
  );
}
