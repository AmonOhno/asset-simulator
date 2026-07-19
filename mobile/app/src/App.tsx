import { useState, useRef, useEffect, useMemo } from "react";
import {
  useAuthStore,
  useFinancialStore,
  useEventsStore,
  formatDateLocal,
  filterSummaryIncludedRows,
} from "@asset-simulator/shared";
import type { ProfitLossView, BalanceSheetView, CalendarJournalEntry } from "@asset-simulator/shared";
import "./App.css";
import CalendarCard from "./CalendarCard";
import TransactionEntryCard from "./TransactionEntryCard";
import { RecurringTransactionCard } from "./RecurringTransactionCard";
import { AccountMasterCard } from "./AccountMasterCard";
import { GoalCard } from "./GoalCard";
import { ProfitLossStatementCard } from "./ProfitLossStatementCard";
import { BalanceSheetCard } from "./BalanceSheetCard";
import { PanelButton } from "@mobile-components/PanelButton";
import { CommonButton } from "@mobile-components/CommonButton";
import { Dialog } from "@mobile-components/Dialog";
import { PeriodSelector } from "@mobile-components/PeriodSelector";
import { computePeriodRange, DEFAULT_PERIOD_SETTINGS, type PeriodPreset, type PeriodSettings } from "@mobile-components/periodSelector.utils";
import LoginScreen from "./LoginScreen";

type TabId = "transaction" | "pl-bs" | "recurring" | "accounts";

const tabs: { id: TabId; label: string }[] = [
  { id: "transaction", label: "取引" },
  { id: "pl-bs", label: "PL/BS" },
  { id: "recurring", label: "定期取引" },
  { id: "accounts", label: "勘定科目" },
];

function getDefaultDates() {
  const now = new Date();
  // PL の期間初期値は「月単位・開始日 25 日」（例: 2026/06/25〜2026/07/24）
  const plRange = computePeriodRange("month", DEFAULT_PERIOD_SETTINGS, now)!;
  return {
    plStart: plRange.startDate,
    plEnd: plRange.endDate,
    bsAsOf: formatDateLocal(now),
  };
}

const defaults = getDefaultDates();

function App() {
  const { session, client, setSession, refreshSession, signOut } = useAuthStore();
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);
  const getJournalAccounts = useFinancialStore((s) => s.getJournalAccounts);
  const getRegularJournalEntries = useFinancialStore((s) => s.getRegularJournalEntries);
  const getProfitLossStatementView = useFinancialStore((s) => s.getProfitLossStatementView);
  const getBalanceSheetView = useFinancialStore((s) => s.getBalanceSheetView);
  const fetchEvents = useEventsStore((s) => s.fetchEvents);

  // 認証状態の監視
  useEffect(() => {
    let isMounted = true;

    refreshSession().then((currentSession) => {
      if (isMounted) setSession(currentSession);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [client, setSession, refreshSession]);

  // ログイン時の初回データ取得
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!session) return;
    if (!hasFetchedRef.current) {
      getJournalAccounts();
      getRegularJournalEntries();
      hasFetchedRef.current = true;
    }
    fetchEvents();
  }, [session, fetchEvents, getJournalAccounts, getRegularJournalEntries]);

  const [activeTab, setActiveTab] = useState<TabId>("transaction");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [entryDialogDate, setEntryDialogDate] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<CalendarJournalEntry | null>(null);
  const [entriesVersion, setEntriesVersion] = useState(0);

  const [plStartDate, setPlStartDate] = useState(defaults.plStart);
  const [plEndDate, setPlEndDate] = useState(defaults.plEnd);
  const [bsAsOfDate, setBsAsOfDate] = useState(defaults.bsAsOf);

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("month");
  const [periodSettings, setPeriodSettings] = useState<PeriodSettings>(DEFAULT_PERIOD_SETTINGS);

  const [plRows, setPlRows] = useState<ProfitLossView[]>([]);
  const [bsRows, setBsRows] = useState<BalanceSheetView[]>([]);

  // 各パネルのサマリーリストの表示/非表示
  const [isProfitOpen, setIsProfitOpen] = useState(false);
  const [isNetAssetsOpen, setIsNetAssetsOpen] = useState(false);

  // PL/BS ビューはサーバー集計を取得（日付変更・取引登録時に再取得）
  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    getProfitLossStatementView(plStartDate, plEndDate).then((rows) => {
      if (isMounted) setPlRows(rows);
    });
    return () => {
      isMounted = false;
    };
  }, [session, plStartDate, plEndDate, entriesVersion, getProfitLossStatementView]);

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    getBalanceSheetView(bsAsOfDate).then((rows) => {
      if (isMounted) setBsRows(rows);
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

  // サマリーに含めない設定（変動資産等）の勘定科目を BS 集計から除外
  const bsRowsForSummary = useMemo(
    () => filterSummaryIncludedRows(bsRows, journalAccounts),
    [bsRows, journalAccounts]
  );

  const netAssets = useMemo(() => {
    const assets = bsRowsForSummary.filter((r) => r.category === "Asset").reduce((s, r) => s + r.sumAmount, 0);
    const liabilities = bsRowsForSummary.filter((r) => r.category === "Liability").reduce((s, r) => s + r.sumAmount, 0);
    return assets - liabilities;
  }, [bsRowsForSummary]);

  // 支出目標（月次）の対象期間。ダッシュボードの月次指定期間と同期する:
  // 月単位プリセット選択中は表示中の期間そのもの、それ以外は期間設定（開始日・休日ずらし）に基づく現在の月次期間。
  const goalMonthRange = useMemo(() => {
    if (periodPreset === "month") return { startDate: plStartDate, endDate: plEndDate };
    return computePeriodRange("month", periodSettings)!;
  }, [periodPreset, plStartDate, plEndDate, periodSettings]);

  // ダッシュボード最上部の期間指定。
  // PL は指定期間、BS の基準日は期間の終了日に同期し、各パネルの金額表示を更新する。
  const handleDashboardPeriodChange = (startDate: string, endDate: string) => {
    setPlStartDate(startDate);
    setPlEndDate(endDate);
    setBsAsOfDate(endDate);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleDateDoubleClick = (date: string) => {
    setEditingEntry(null);
    setEntryDialogDate(date);
  };

  const handleEditEntry = (entry: CalendarJournalEntry) => {
    setEntryDialogDate(null);
    setEditingEntry(entry);
  };

  const closeEntryDialog = () => {
    setEntryDialogDate(null);
    setEditingEntry(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "transaction":
        return (
          <div style={{ display: "grid", gap: 24 }}>
            <CalendarCard
              onDateSelect={handleDateSelect}
              onDateDoubleClick={handleDateDoubleClick}
              onEditEntry={handleEditEntry}
              refreshSignal={entriesVersion}
              onEntryChanged={() => setEntriesVersion((v) => v + 1)}
            />
            <GoalCard monthRange={goalMonthRange} refreshSignal={entriesVersion} />
          </div>
        );
      case "pl-bs":
        return (
          <div style={{ display: "grid", gap: 16 }}>
            {/* ダッシュボード最上部の期間指定（PL 期間・BS 基準日を一括同期） */}
            <div
              style={{
                width: "100%",
                maxWidth: 358,
                borderRadius: 12,
                background: "#FFFFFF",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
                boxSizing: "border-box",
                padding: 20,
              }}
            >
              <PeriodSelector
                range={{ startDate: plStartDate, endDate: plEndDate }}
                onChange={(r) => handleDashboardPeriodChange(r.startDate, r.endDate)}
                preset={periodPreset}
                onPresetChange={setPeriodPreset}
                settings={periodSettings}
                onSettingsChange={setPeriodSettings}
              />
            </div>

            {/* 純利益パネル: パネルボタン → 収益・費用サマリーリスト */}
            <div style={{ display: "grid", gap: 16 }}>
              <PanelButton
                title="当期純利益"
                value={`¥${profit.toLocaleString()}`}
                subText={`${plStartDate} 〜 ${plEndDate}`}
                onClick={() => setIsProfitOpen((prev) => !prev)}
              />
              {/* サマリーリストは常時マウントし表示のみ切り替える（期間セレクターのマウント時リセットを防ぐ） */}
              <div style={{ display: isProfitOpen ? "block" : "none" }}>
                <ProfitLossStatementCard
                  appliedStartDate={plStartDate}
                  appliedEndDate={plEndDate}
                  rows={plRows}
                  onApply={(s, e) => { setPlStartDate(s); setPlEndDate(e); }}
                  preset={periodPreset}
                  onPresetChange={setPeriodPreset}
                  settings={periodSettings}
                  onSettingsChange={setPeriodSettings}
                />
              </div>
            </div>

            {/* 純資産パネル: パネルボタン → 資産・負債サマリーリスト */}
            <div style={{ display: "grid", gap: 16 }}>
              <PanelButton
                title="純資産合計"
                value={`¥${netAssets.toLocaleString()}`}
                subText={`基準日: ${bsAsOfDate}`}
                onClick={() => setIsNetAssetsOpen((prev) => !prev)}
              />
              {isNetAssetsOpen && (
                <BalanceSheetCard
                  appliedAsOfDate={bsAsOfDate}
                  rows={bsRowsForSummary}
                  onApply={(d) => setBsAsOfDate(d)}
                />
              )}
            </div>

            {/* 支出目標パネル: 勘定科目ごと・日次/月次の支出目標を設定・進捗確認（月次はダッシュボードの月次指定期間と同期） */}
            <GoalCard monthRange={goalMonthRange} refreshSignal={entriesVersion} />
          </div>
        );
      case "recurring":
        return <RecurringTransactionCard />;
      case "accounts":
        return <AccountMasterCard />;
      default:
        return (
          <div style={{ display: "grid", gap: 24 }}>
            <CalendarCard onDateSelect={handleDateSelect} />
            {selectedDate && <TransactionEntryCard selectedDate={selectedDate} />}
          </div>
        );
    }
  };

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "#F3F4F6", color: "#111827" }}>
      <header style={{ flexShrink: 0, display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #E5E7EB", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 20, color: "#4B5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>取引管理ダッシュボード</h1>
        <CommonButton label="ログアウト" sizeVariant="M" colorVariant="secondary" onClick={signOut} />
      </header>
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ maxWidth: 900, width: "100%" }}>{renderContent()}</div>
      </div>
      <nav style={{ flexShrink: 0, display: "flex", flexDirection: "row", overflowX: "auto", borderTop: "1px solid #E5E7EB", background: "#FFFFFF" }}>
        {tabs.map((tab) => (
          <button
            style={{ padding: "20px 24px", minHeight: 60, border: "none", borderBottom: activeTab === tab.id ? "3px solid #3B82F6" : "3px solid transparent", background: activeTab === tab.id ? "#EFF6FF" : "transparent", color: activeTab === tab.id ? "#1F2937" : "#6B7280", fontSize: 15, fontWeight: activeTab === tab.id ? 600 : 400, whiteSpace: "nowrap", minWidth: "fit-content", cursor: "pointer", transition: "all 0.2s ease" }}
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
      <Dialog
        isOpen={entryDialogDate != null || editingEntry != null}
        onClose={closeEntryDialog}
        title={editingEntry ? "取引編集" : "取引入力"}
      >
        {editingEntry ? (
          <TransactionEntryCard
            key={editingEntry.id}
            entry={editingEntry}
            onEntryUpdated={() => {
              setEntriesVersion((v) => v + 1);
              closeEntryDialog();
            }}
          />
        ) : entryDialogDate ? (
          <TransactionEntryCard
            key={entryDialogDate}
            selectedDate={entryDialogDate}
            onEntryAdded={() => {
              setEntriesVersion((v) => v + 1);
              closeEntryDialog();
            }}
          />
        ) : null}
      </Dialog>
    </main>
  );
}

export default App;
