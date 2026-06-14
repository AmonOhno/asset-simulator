import { useState, useRef } from "react";
import "./App.css";
import CalendarCard from "./CalendarCard";
import TransactionEntryCard from "./TransactionEntryCard";
import { RecurringTransactionCard } from "./RecurringTransactionCard";
import { ProfitLossStatementCard } from "./ProfitLossStatementCard";
import { BalanceSheetCard } from "./BalanceSheetCard";
import { PanelButton } from "../../src/components/PanelButton";
import { calculateProfit, calculateNetAssets } from "./data/financial";

type TabId = "transaction" | "pl-bs" | "recurring";
type PlViewType = "profit-loss" | "balance-sheet" | "none";

const tabs: { id: TabId; label: string }[] = [
  { id: "transaction", label: "取引" },
  { id: "pl-bs", label: "PL/BS" },
  { id: "recurring", label: "定期取引" },
];

function getDefaultDates() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = now.getMonth();
  const fmt = (d: Date) => {
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
  const [activeTab, setActiveTab] = useState<TabId>("transaction");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [plStartDate, setPlStartDate] = useState(defaults.plStart);
  const [plEndDate, setPlEndDate] = useState(defaults.plEnd);
  const [bsAsOfDate, setBsAsOfDate] = useState(defaults.bsAsOf);

  const plCardRef = useRef<HTMLDivElement>(null);
  const bsCardRef = useRef<HTMLDivElement>(null);

  const { profit } = calculateProfit(plStartDate, plEndDate);
  const { netAssets } = calculateNetAssets(bsAsOfDate);

  const setPlView = (view: PlViewType) => {
    if (view === "profit-loss") {
      plCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (view === "balance-sheet") {
      bsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "transaction":
        return (
          <div style={{ display: "grid", gap: 24 }}>
            <CalendarCard onDateSelect={handleDateSelect} />
            {selectedDate && (
              <TransactionEntryCard
                key={selectedDate}
                selectedDate={selectedDate}
              />
            )}
          </div>
        );
      case "pl-bs":
        return (
          <div style={{ display: "grid", gap: 24 }}>
            <div style={{ display: "grid", gap: 16 }}>
              <PanelButton
                title="当期純利益"
                value={`¥${profit.toLocaleString()}`}
                subText={`${plStartDate} 〜 ${plEndDate}`}
                onClick={() => setPlView("profit-loss")}
              />
              <PanelButton
                title="純資産合計"
                value={`¥${netAssets.toLocaleString()}`}
                subText={`基準日: ${bsAsOfDate}`}
                onClick={() => setPlView("balance-sheet")}
              />

              <div ref={plCardRef}>
                <ProfitLossStatementCard
                  appliedStartDate={plStartDate}
                  appliedEndDate={plEndDate}
                  onApply={(s, e) => { setPlStartDate(s); setPlEndDate(e); }}
                />
              </div>
              <div ref={bsCardRef}>
                <BalanceSheetCard
                  appliedAsOfDate={bsAsOfDate}
                  onApply={(d) => setBsAsOfDate(d)}
                />
              </div>
            </div>
          </div>
        );
      case "recurring":
        return <RecurringTransactionCard />;
      default:
        return (
          <div style={{ display: "grid", gap: 24 }}>
            <CalendarCard onDateSelect={handleDateSelect} />
            {selectedDate && <TransactionEntryCard selectedDate={selectedDate} />}
          </div>
        );
    }
  };

  return (
    <main style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#F3F4F6", color: "#111827" }}>
      <header style={{ display: "flex", flexDirection: "row", padding: "32px 32px 16px", borderBottom: "1px solid #E5E7EB" }}>
        <h1 style={{ margin: 0, fontSize: 34, marginBottom: 18, color: "#4B5563" }}>取引管理ダッシュボード</h1>
      </header>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", maxHeight: "calc(100vh - 120px)" }}>
        <div style={{ display: "flex", flexDirection: "row", flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ maxWidth: 900, width: "100%" }}>{renderContent()}</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "row", overflowX: "auto", borderTop: "1px solid #E5E7EB", background: "#FFFFFF" }}>
          {tabs.map((tab) => (
            <button
              style={{ padding: "16px 24px", border: "none", borderBottom: activeTab === tab.id ? "3px solid #3B82F6" : "3px solid transparent", background: activeTab === tab.id ? "#EFF6FF" : "transparent", color: activeTab === tab.id ? "#1F2937" : "#6B7280", fontSize: 15, fontWeight: activeTab === tab.id ? 600 : 400, whiteSpace: "nowrap", minWidth: "fit-content", cursor: "pointer", transition: "all 0.2s ease" }}
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedDate(null);
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

export default App;
