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
export function BalanceSheetCard({ appliedAsOfDate, rows, onApply }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [pendingDate, setPendingDate] = useState(appliedAsOfDate);
    // サーバー集計済みの BalanceSheetView を表示用の行へマッピング
    const grouped = useMemo(() => rows.map((row) => ({ account: row.name, category: row.category, amount: row.sumAmount })), [rows]);
    const assetsTotal = grouped
        .filter((row) => row.category === "Asset")
        .reduce((sum, item) => sum + item.amount, 0);
    const liabilityTotal = grouped
        .filter((row) => row.category === "Liability")
        .reduce((sum, item) => sum + item.amount, 0);
    const summeryTotal = assetsTotal - liabilityTotal;
    const presets = getDatePresets();
    const applyPreset = (date) => {
        setPendingDate(date);
        onApply(date);
    };
    return (_jsxs(Card, { title: "\u8CB8\u501F\u5BFE\u7167\u8868\u3010BS\u3011", subInfo: appliedAsOfDate, isExpanded: isExpanded, onToggle: () => setIsExpanded((prev) => !prev), children: [_jsx(CardBodyHead, { children: _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [_jsxs("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [_jsx(CommonButton, { label: "\u4ECA\u65E5", sizeVariant: "S", fontSize: "S", colorVariant: "secondary", onClick: () => applyPreset(presets.today) }), _jsx(CommonButton, { label: "\u4ECA\u6708\u672B", sizeVariant: "S", fontSize: "S", colorVariant: "secondary", onClick: () => applyPreset(presets.thisMonthEnd) }), _jsx(CommonButton, { label: "\u5148\u6708\u672B", sizeVariant: "S", fontSize: "S", colorVariant: "secondary", onClick: () => applyPreset(presets.lastMonthEnd) })] }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }, children: [_jsx(DateInput, { value: pendingDate, onChange: setPendingDate, sizeVariant: "M" }), _jsx(CommonButton, { label: "\u57FA\u6E96\u65E5\u53CD\u6620", onClick: () => onApply(pendingDate) })] })] }) }), _jsxs(CardBodyMain, { children: [_jsx(DataGrid, { data: grouped, columns: [
                            { label: "勘定科目", key: "account", width: 180 },
                            { label: "区分", key: "category", width: 120, align: "center" },
                            { label: "残高", key: "amount", width: 140, align: "right" },
                        ], colorVariant: "gray" }), _jsxs("div", { style: {
                            display: "grid",
                            gap: 8,
                            marginTop: 12,
                            fontWeight: 700,
                            fontSize: 14,
                        }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { children: "\u8CC7\u7523\u5408\u8A08:" }), _jsxs("span", { children: ["\u00A5", assetsTotal.toLocaleString()] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { children: "\u8CA0\u50B5\u30FB\u7D14\u8CC7\u7523\u5408\u8A08:" }), _jsxs("span", { children: ["\u00A5", liabilityTotal.toLocaleString()] })] }), _jsxs("div", { style: {
                                    display: "flex",
                                    justifyContent: "space-between",
                                    paddingTop: 8,
                                    borderTop: "1px solid #D1D5DB",
                                    color: summeryTotal >= 0 ? "#047857" : "#DC2626",
                                }, children: [_jsx("span", { children: "\u7D14\u8CC7\u7523\u5408\u8A08:" }), _jsxs("span", { children: ["\u00A5", summeryTotal.toLocaleString()] })] })] })] })] }));
}
