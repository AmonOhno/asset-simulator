import { useMemo, useState } from "react";
import type { BalanceSheetView } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "@mobile-components/Card";
import { DateInput } from "@mobile-components/DateInput";
import { CommonButton } from "@mobile-components/CommonButton";
import { DataGrid } from "@mobile-components/DataGrid";

type Props = {
  appliedAsOfDate: string;
  rows: BalanceSheetView[];
  onApply: (date: string) => void;
};

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDatePresets() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();
  return {
    today: fmt(now),
    thisMonthEnd: fmt(new Date(y, mo + 1, 0)),
    lastMonthEnd: fmt(new Date(y, mo, 0)),
  };
}

export function BalanceSheetCard({ appliedAsOfDate, rows, onApply }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingDate, setPendingDate] = useState(appliedAsOfDate);

  // サーバー集計済みの BalanceSheetView を表示用の行へマッピング
  const grouped = useMemo(
    () => rows.map((row) => ({ account: row.name, category: row.category, amount: row.sumAmount })),
    [rows]
  );

  const assetsTotal = grouped
    .filter((row) => row.category === "Asset")
    .reduce((sum, item) => sum + item.amount, 0);
  const liabilityTotal = grouped
    .filter((row) => row.category === "Liability")
    .reduce((sum, item) => sum + item.amount, 0);
  const summeryTotal = assetsTotal - liabilityTotal;

  const presets = getDatePresets();

  const applyPreset = (date: string) => {
    setPendingDate(date);
    onApply(date);
  };

  return (
    <Card
      title="貸借対照表【BS】"
      subInfo={appliedAsOfDate}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <CommonButton label="今日" sizeVariant="S" fontSize="S" colorVariant="secondary" onClick={() => applyPreset(presets.today)} />
            <CommonButton label="今月末" sizeVariant="S" fontSize="S" colorVariant="secondary" onClick={() => applyPreset(presets.thisMonthEnd)} />
            <CommonButton label="先月末" sizeVariant="S" fontSize="S" colorVariant="secondary" onClick={() => applyPreset(presets.lastMonthEnd)} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <DateInput value={pendingDate} onChange={setPendingDate} sizeVariant="M" />
            <CommonButton label="基準日反映" onClick={() => onApply(pendingDate)} />
          </div>
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
