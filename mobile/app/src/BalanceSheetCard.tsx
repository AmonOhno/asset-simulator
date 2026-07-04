import { useMemo, type CSSProperties } from "react";
import { formatDateLocal } from "@asset-simulator/shared";
import type { BalanceSheetView } from "@asset-simulator/shared";
import { DateInput } from "@mobile-components/DateInput";
import { CommonButton } from "@mobile-components/CommonButton";
import { DataGrid } from "@mobile-components/DataGrid";

type Props = {
  appliedAsOfDate: string;
  rows: BalanceSheetView[];
  onApply: (date: string) => void;
};

const fmt = formatDateLocal;

// 区分の表示順（貸借対照表: 資産→負債→純資産）
const CATEGORY_ORDER: Record<string, number> = { Asset: 0, Liability: 1, Equity: 2 };

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

// 資産・負債サマリーリスト（純資産パネル配下に表示される明細）
export function BalanceSheetCard({ appliedAsOfDate, rows, onApply }: Props) {
  // サーバー集計済みの BalanceSheetView を表示用の行へマッピング（区分→勘定科目でソート）
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

  const assetsTotal = grouped
    .filter((row) => row.category === "Asset")
    .reduce((sum, item) => sum + item.amount, 0);
  const liabilityTotal = grouped
    .filter((row) => row.category === "Liability")
    .reduce((sum, item) => sum + item.amount, 0);
  const summeryTotal = assetsTotal - liabilityTotal;

  const presets = getDatePresets();

  const applyPreset = (date: string) => {
    onApply(date);
  };

  return (
    <div style={container}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <CommonButton label="今日" sizeVariant="S" fontSize="S" colorVariant="secondary" onClick={() => applyPreset(presets.today)} />
          <CommonButton label="今月末" sizeVariant="S" fontSize="S" colorVariant="secondary" onClick={() => applyPreset(presets.thisMonthEnd)} />
          <CommonButton label="先月末" sizeVariant="S" fontSize="S" colorVariant="secondary" onClick={() => applyPreset(presets.lastMonthEnd)} />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <DateInput value={appliedAsOfDate} onChange={(v: string) => onApply(v)} sizeVariant="M" />
        </div>
      </div>
      <div>
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
      </div>
    </div>
  );
}
