import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useFinancialStore } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "@mobile-components/Card";
import { DataGrid } from "@mobile-components/DataGrid";
function fmt(date) {
    return date.toLocaleDateString("sv-SE");
}
function getMonthDays(year, month) {
    const end = new Date(year, month + 1, 0);
    const days = [];
    for (let day = 1; day <= end.getDate(); day += 1) {
        days.push(new Date(year, month, day));
    }
    return days;
}
function formatMonthLabel(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}
function getWeekdayLabels() {
    return ["日", "月", "火", "水", "木", "金", "土"];
}
export default function CalendarCard({ onDateDoubleClick, onDateSelect, refreshSignal }) {
    const getCalendarJournalEntries = useFinancialStore((s) => s.getCalendarJournalEntries);
    const [monthOffset, setMonthOffset] = useState(0);
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const [selectedDate, setSelectedDate] = useState(() => fmt(today));
    const [entries, setEntries] = useState([]);
    const monthStart = fmt(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    const monthEnd = fmt(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
    useEffect(() => {
        let isMounted = true;
        getCalendarJournalEntries(monthStart, monthEnd).then((rows) => {
            if (isMounted)
                setEntries(rows);
        });
        return () => {
            isMounted = false;
        };
    }, [monthStart, monthEnd, refreshSignal, getCalendarJournalEntries]);
    const days = getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth());
    const firstWeekday = currentMonth.getDay();
    const selected = selectedDate;
    const countByDate = useMemo(() => {
        const map = {};
        entries.forEach((e) => {
            map[e.date] = (map[e.date] ?? 0) + 1;
        });
        return map;
    }, [entries]);
    const filtered = useMemo(() => entries
        .filter((e) => e.date === selected)
        .map((e) => ({
        description: e.description,
        debitAccount: e.debitAccountName,
        creditAccount: e.creditAccountName,
        amount: e.amount,
    })), [entries, selected]);
    return (_jsxs(Card, { title: "\u53D6\u5F15\u30AB\u30EC\u30F3\u30C0\u30FC", subInfo: `選択日: ${selected} (${filtered.length}件)`, isExpanded: true, onToggle: () => undefined, children: [_jsx(CardBodyHead, { children: _jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }, children: [_jsx("button", { type: "button", onClick: () => setMonthOffset((prev) => prev - 1), style: {
                                border: "1px solid #D1D5DB",
                                borderRadius: 8,
                                padding: "8px 12px",
                                background: "#FFFFFF",
                                cursor: "pointer",
                            }, children: "\u524D\u6708" }), _jsx("div", { style: { fontWeight: 700, fontSize: 16, lineHeight: 1.3, textAlign: "center", flex: 1 }, children: formatMonthLabel(currentMonth) }), _jsx("button", { type: "button", onClick: () => setMonthOffset((prev) => prev + 1), style: {
                                border: "1px solid #D1D5DB",
                                borderRadius: 8,
                                padding: "8px 12px",
                                background: "#FFFFFF",
                                cursor: "pointer",
                            }, children: "\u6B21\u6708" })] }) }), _jsxs(CardBodyMain, { children: [_jsx("div", { style: {
                            display: "grid",
                            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                            gap: 8,
                            textAlign: "center",
                            marginBottom: 8,
                        }, children: getWeekdayLabels().map((label) => (_jsx("div", { style: { color: "#6B7280", fontSize: 13, fontWeight: 700 }, children: label }, label))) }), _jsxs("div", { style: {
                            display: "grid",
                            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                            gap: 8,
                        }, children: [Array.from({ length: firstWeekday }).map((_, index) => (_jsx("div", {}, `blank-${index}`))), days.map((date) => {
                                const iso = fmt(date);
                                const isToday = iso === fmt(today);
                                const isSelected = iso === selected;
                                const dayTransactionCount = countByDate[iso] ?? 0;
                                return (_jsxs("button", { type: "button", onClick: () => {
                                        setSelectedDate(iso);
                                        onDateSelect?.(iso);
                                    }, onDoubleClick: () => onDateDoubleClick?.(iso), style: {
                                        border: "1px solid #E5E7EB",
                                        borderRadius: 12,
                                        padding: "12px 0",
                                        background: isSelected ? "#3B82F6" : isToday ? "#EFF6FF" : "#FFFFFF",
                                        color: isSelected ? "#FFFFFF" : "#111827",
                                        cursor: "pointer",
                                        position: "relative",
                                    }, children: [date.getDate(), dayTransactionCount > 0 && (_jsx("div", { style: {
                                                position: "absolute",
                                                top: 2,
                                                right: 2,
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                background: isSelected ? "#FFFFFF" : "#3B82F6",
                                            } }))] }, iso));
                            })] }), _jsxs("div", { style: { marginTop: 16, fontSize: 14, color: "#4B5563" }, children: [_jsx(DataGrid, { data: filtered, columns: [
                                    { label: "摘要", key: "description", width: 160 },
                                    { label: "借方", key: "debitAccount", width: 140 },
                                    { label: "貸方", key: "creditAccount", width: 140 },
                                    { label: "金額", key: "amount", width: 120, align: "right" },
                                ], colorVariant: "gray" }), "\u9078\u629E\u3057\u305F\u65E5\u4ED8\u306E\u53D6\u5F15\u3092\u5165\u529B\u30FB\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002\u30C0\u30D6\u30EB\u30BF\u30C3\u30D7\u3067\u53D6\u5F15\u5165\u529B\u3078\u3002"] })] })] }));
}
