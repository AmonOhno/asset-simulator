import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuthStore, useFinancialStore, useEventsStore, } from "@asset-simulator/shared";
import "./App.css";
import CalendarCard from "./CalendarCard";
import TransactionEntryCard from "./TransactionEntryCard";
import { RecurringTransactionCard } from "./RecurringTransactionCard";
import { AccountMasterCard } from "./AccountMasterCard";
import { ProfitLossStatementCard } from "./ProfitLossStatementCard";
import { BalanceSheetCard } from "./BalanceSheetCard";
import { PanelButton } from "@mobile-components/PanelButton";
import { CommonButton } from "@mobile-components/CommonButton";
import LoginScreen from "./LoginScreen";
const tabs = [
    { id: "transaction", label: "取引" },
    { id: "pl-bs", label: "PL/BS" },
    { id: "recurring", label: "定期取引" },
    { id: "accounts", label: "勘定科目" },
];
function getDefaultDates() {
    const now = new Date();
    const y = now.getFullYear();
    const mo = now.getMonth();
    const fmt = (d) => {
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${d.getFullYear()}-${m}-${day}`;
    };
    return {
        plStart: fmt(new Date(y, mo, 1)),
        plEnd: fmt(new Date(y, mo + 1, 0)),
        bsAsOf: fmt(now),
    };
}
const defaults = getDefaultDates();
function App() {
    const { session, client, setSession, refreshSession, signOut } = useAuthStore();
    const getJournalAccounts = useFinancialStore((s) => s.getJournalAccounts);
    const getRegularJournalEntries = useFinancialStore((s) => s.getRegularJournalEntries);
    const getProfitLossStatementView = useFinancialStore((s) => s.getProfitLossStatementView);
    const getBalanceSheetView = useFinancialStore((s) => s.getBalanceSheetView);
    const fetchEvents = useEventsStore((s) => s.fetchEvents);
    // 認証状態の監視
    useEffect(() => {
        let isMounted = true;
        refreshSession().then((currentSession) => {
            if (isMounted)
                setSession(currentSession);
        });
        const { data: { subscription }, } = client.auth.onAuthStateChange((_event, nextSession) => {
            if (isMounted)
                setSession(nextSession);
        });
        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [client, setSession, refreshSession]);
    // ログイン時の初回データ取得
    const hasFetchedRef = useRef(false);
    useEffect(() => {
        if (!session)
            return;
        if (!hasFetchedRef.current) {
            getJournalAccounts();
            getRegularJournalEntries();
            hasFetchedRef.current = true;
        }
        fetchEvents();
    }, [session, fetchEvents, getJournalAccounts, getRegularJournalEntries]);
    const [activeTab, setActiveTab] = useState("transaction");
    const [selectedDate, setSelectedDate] = useState(null);
    const [entriesVersion, setEntriesVersion] = useState(0);
    const [plStartDate, setPlStartDate] = useState(defaults.plStart);
    const [plEndDate, setPlEndDate] = useState(defaults.plEnd);
    const [bsAsOfDate, setBsAsOfDate] = useState(defaults.bsAsOf);
    const [plRows, setPlRows] = useState([]);
    const [bsRows, setBsRows] = useState([]);
    const plCardRef = useRef(null);
    const bsCardRef = useRef(null);
    // PL/BS ビューはサーバー集計を取得（日付変更・取引登録時に再取得）
    useEffect(() => {
        if (!session)
            return;
        let isMounted = true;
        getProfitLossStatementView(plStartDate, plEndDate).then((rows) => {
            if (isMounted)
                setPlRows(rows);
        });
        return () => {
            isMounted = false;
        };
    }, [session, plStartDate, plEndDate, entriesVersion, getProfitLossStatementView]);
    useEffect(() => {
        if (!session)
            return;
        let isMounted = true;
        getBalanceSheetView(bsAsOfDate).then((rows) => {
            if (isMounted)
                setBsRows(rows);
        });
        return () => {
            isMounted = false;
        };
    }, [session, bsAsOfDate, entriesVersion, getBalanceSheetView]);
    const profit = useMemo(() => {
        const revenue = plRows.filter((r) => r.category === "Revenue").reduce((s, r) => s + r.sumAmount, 0);
        const expense = plRows.filter((r) => r.category === "Expense").reduce((s, r) => s + r.sumAmount, 0);
        return revenue - expense;
    }, [plRows]);
    const netAssets = useMemo(() => {
        const assets = bsRows.filter((r) => r.category === "Asset").reduce((s, r) => s + r.sumAmount, 0);
        const liabilities = bsRows.filter((r) => r.category === "Liability").reduce((s, r) => s + r.sumAmount, 0);
        return assets - liabilities;
    }, [bsRows]);
    const setPlView = (view) => {
        if (view === "profit-loss") {
            plCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        else if (view === "balance-sheet") {
            bsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };
    const handleDateSelect = (date) => {
        setSelectedDate(date);
    };
    const renderContent = () => {
        switch (activeTab) {
            case "transaction":
                return (_jsxs("div", { style: { display: "grid", gap: 24 }, children: [_jsx(CalendarCard, { onDateSelect: handleDateSelect, refreshSignal: entriesVersion }), selectedDate && (_jsx(TransactionEntryCard, { selectedDate: selectedDate, onEntryAdded: () => setEntriesVersion((v) => v + 1) }, selectedDate))] }));
            case "pl-bs":
                return (_jsx("div", { style: { display: "grid", gap: 24 }, children: _jsxs("div", { style: { display: "grid", gap: 16 }, children: [_jsx(PanelButton, { title: "\u5F53\u671F\u7D14\u5229\u76CA", value: `¥${profit.toLocaleString()}`, subText: `${plStartDate} 〜 ${plEndDate}`, onClick: () => setPlView("profit-loss") }), _jsx(PanelButton, { title: "\u7D14\u8CC7\u7523\u5408\u8A08", value: `¥${netAssets.toLocaleString()}`, subText: `基準日: ${bsAsOfDate}`, onClick: () => setPlView("balance-sheet") }), _jsx("div", { ref: plCardRef, children: _jsx(ProfitLossStatementCard, { appliedStartDate: plStartDate, appliedEndDate: plEndDate, rows: plRows, onApply: (s, e) => { setPlStartDate(s); setPlEndDate(e); } }) }), _jsx("div", { ref: bsCardRef, children: _jsx(BalanceSheetCard, { appliedAsOfDate: bsAsOfDate, rows: bsRows, onApply: (d) => setBsAsOfDate(d) }) })] }) }));
            case "recurring":
                return _jsx(RecurringTransactionCard, {});
            case "accounts":
                return _jsx(AccountMasterCard, {});
            default:
                return (_jsxs("div", { style: { display: "grid", gap: 24 }, children: [_jsx(CalendarCard, { onDateSelect: handleDateSelect }), selectedDate && _jsx(TransactionEntryCard, { selectedDate: selectedDate })] }));
        }
    };
    if (!session) {
        return _jsx(LoginScreen, {});
    }
    return (_jsxs("main", { style: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "#F3F4F6", color: "#111827" }, children: [_jsxs("header", { style: { display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: "32px 32px 16px", borderBottom: "1px solid #E5E7EB" }, children: [_jsx("h1", { style: { margin: 0, fontSize: 34, marginBottom: 18, color: "#4B5563" }, children: "\u53D6\u5F15\u7BA1\u7406\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9" }), _jsx(CommonButton, { label: "\u30ED\u30B0\u30A2\u30A6\u30C8", sizeVariant: "S", colorVariant: "secondary", onClick: signOut })] }), _jsxs("div", { style: { display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", maxHeight: "calc(100vh - 120px)" }, children: [_jsx("div", { style: { display: "flex", flexDirection: "row", flex: 1, overflowY: "auto", padding: 20 }, children: _jsx("div", { style: { maxWidth: 900, width: "100%" }, children: renderContent() }) }), _jsx("nav", { style: { display: "flex", flexDirection: "row", overflowX: "auto", borderTop: "1px solid #E5E7EB", background: "#FFFFFF" }, children: tabs.map((tab) => (_jsx("button", { style: { padding: "16px 24px", border: "none", borderBottom: activeTab === tab.id ? "3px solid #3B82F6" : "3px solid transparent", background: activeTab === tab.id ? "#EFF6FF" : "transparent", color: activeTab === tab.id ? "#1F2937" : "#6B7280", fontSize: 15, fontWeight: activeTab === tab.id ? 600 : 400, whiteSpace: "nowrap", minWidth: "fit-content", cursor: "pointer", transition: "all 0.2s ease" }, onClick: () => {
                                setActiveTab(tab.id);
                                setSelectedDate(null);
                            }, children: tab.label }, tab.id))) })] })] }));
}
export default App;
