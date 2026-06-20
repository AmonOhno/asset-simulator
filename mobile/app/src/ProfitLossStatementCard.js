import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Card, CardBodyHead, CardBodyMain } from "@mobile-components/Card";
import { DateInput } from "@mobile-components/DateInput";
import { CommonButton } from "@mobile-components/CommonButton";
import { DataGrid } from "@mobile-components/DataGrid";
function fmt(d) {
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
        thisMonth: [fmt(new Date(y, mo, 1)), fmt(new Date(y, mo + 1, 0))],
        lastMonth: [fmt(new Date(y, mo - 1, 1)), fmt(new Date(y, mo, 0))],
        thisQuarter: [fmt(new Date(y, q * 3, 1)), fmt(new Date(y, q * 3 + 3, 0))],
        thisYear: [`${y}-01-01`, `${y}-12-31`],
    };
}
export function ProfitLossStatementCard({ appliedStartDate, appliedEndDate, rows, onApply }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [pendingStart, setPendingStart] = useState(appliedStartDate);
    const [pendingEnd, setPendingEnd] = useState(appliedEndDate);
    // サーバー集計済みの ProfitLossView を表示用の行へマッピング
    const grouped = useMemo(() => rows.map((row) => ({ account: row.name, category: row.category, amount: row.sumAmount })), [rows]);
    const revenueTotal = grouped
        .filter((row) => row.category === "Revenue")
        .reduce((sum, item) => sum + item.amount, 0);
    const expenseTotal = grouped
        .filter((row) => row.category === "Expense")
        .reduce((sum, item) => sum + item.amount, 0);
    const profit = revenueTotal - expenseTotal;
    const presets = getPeriodPresets();
    const applyPreset = (start, end) => {
        setPendingStart(start);
        setPendingEnd(end);
        onApply(start, end);
    };
    return (_jsxs(Card, { title: "\u640D\u76CA\u8A08\u7B97\u66F8\u3010PL\u3011", subInfo: `${appliedStartDate} 〜 ${appliedEndDate}`, isExpanded: isExpanded, onToggle: () => setIsExpanded((prev) => !prev), children: [_jsx(CardBodyHead, { children: _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [_jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [_jsx(CommonButton, { label: "\u4ECA\u6708", fontSize: "S", sizeVariant: "S", colorVariant: "secondary", onClick: () => applyPreset(...presets.thisMonth) }), _jsx(CommonButton, { label: "\u5148\u6708", fontSize: "S", sizeVariant: "S", colorVariant: "secondary", onClick: () => applyPreset(...presets.lastMonth) }), _jsx(CommonButton, { label: "3\u30F6\u6708", fontSize: "S", sizeVariant: "S", colorVariant: "secondary", onClick: () => applyPreset(...presets.thisQuarter) }), _jsx(CommonButton, { label: "\u4ECA\u5E74", fontSize: "S", sizeVariant: "S", colorVariant: "secondary", onClick: () => applyPreset(...presets.thisYear) })] }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [_jsx(DateInput, { value: pendingStart, onChange: setPendingStart, sizeVariant: "S" }), _jsx("span", { style: { alignSelf: "center", color: "#6B7280" }, children: "\u301C" }), _jsx(DateInput, { value: pendingEnd, onChange: setPendingEnd, sizeVariant: "S" }), _jsx(CommonButton, { label: "\u671F\u9593\u53CD\u6620", onClick: () => onApply(pendingStart, pendingEnd) })] })] }) }), _jsxs(CardBodyMain, { children: [_jsx(DataGrid, { data: grouped, columns: [
                            { label: "勘定科目", key: "account", width: 180 },
                            { label: "区分", key: "category", width: 120, align: "center" },
                            { label: "合計金額", key: "amount", width: 140, align: "right" },
                        ], colorVariant: "gray" }), _jsxs("div", { style: {
                            display: "grid",
                            gap: 8,
                            marginTop: 12,
                            fontWeight: 700,
                            fontSize: 14,
                        }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { children: "\u53CE\u76CA\u5408\u8A08:" }), _jsxs("span", { children: ["\u00A5", revenueTotal.toLocaleString()] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { children: "\u8CBB\u7528\u5408\u8A08:" }), _jsxs("span", { children: ["\u00A5", expenseTotal.toLocaleString()] })] }), _jsxs("div", { style: {
                                    display: "flex",
                                    justifyContent: "space-between",
                                    paddingTop: 8,
                                    borderTop: "1px solid #D1D5DB",
                                    color: profit >= 0 ? "#047857" : "#DC2626",
                                }, children: [_jsx("span", { children: "\u5F53\u671F\u7D14\u5229\u76CA:" }), _jsxs("span", { children: ["\u00A5", profit.toLocaleString()] })] })] })] })] }));
}
