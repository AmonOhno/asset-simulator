import { useState, useRef, useEffect, useMemo } from "react";
import {
  useAuthStore,
  useFinancialStore,
  useEventsStore,
  fetchProfitLoss,
  fetchBalanceSheet,
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
import { TextInput } from "@mobile-components/TextInput";
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

const MEMO_STORAGE_PREFIX = "asset-simulator:memo:";

// メモは DB に保存せず端末の localStorage に置く。
// プライベートブラウズ等で localStorage が使えない環境では、画面内の保持だけに退避する。
function readStoredMemo(userId: string): string {
  try {
    return localStorage.getItem(MEMO_STORAGE_PREFIX + userId) ?? "";
  } catch {
    return "";
  }
}

function writeStoredMemo(userId: string, value: string) {
  try {
    localStorage.setItem(MEMO_STORAGE_PREFIX + userId, value);
  } catch {
    // 保存できない環境では復元を諦める
  }
}

function App() {
  const { session, client, setSession, refreshSession, signOut } = useAuthStore();
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);
  const fetchJournalAccounts = useFinancialStore((s) => s.fetchJournalAccounts);
  const fetchRegularJournalEntries = useFinancialStore((s) => s.fetchRegularJournalEntries);
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
      fetchJournalAccounts();
      fetchRegularJournalEntries();
      hasFetchedRef.current = true;
    }
    fetchEvents();
  }, [session, fetchEvents, fetchJournalAccounts, fetchRegularJournalEntries]);

  const [activeTab, setActiveTab] = useState<TabId>("transaction");
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

  // タブ配下ではなくヘッダーに置くメモ。ユーザー単位で localStorage に保持する。
  const userId = session?.user?.id ?? null;
  const [memo, setMemo] = useState(() => (userId ? readStoredMemo(userId) : ""));

  // ログイン・ユーザー切り替えでメモを読み直す（レンダー中の state リセットパターン）
  const [memoUserId, setMemoUserId] = useState(userId);
  if (memoUserId !== userId) {
    setMemoUserId(userId);
    setMemo(userId ? readStoredMemo(userId) : "");
  }

  // 保存は入力時のみ。memo を依存に持つ effect で保存すると、
  // ユーザー切り替え直後に前ユーザーのメモで上書きしてしまう。
  const handleMemoChange = (value: string) => {
    setMemo(value);
    if (userId) writeStoredMemo(userId, value);
  };

  // PL/BS ビューはサーバー集計を取得（日付変更・取引登録時に再取得）
  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    fetchProfitLoss(plStartDate, plEndDate).then((rows) => {
      if (isMounted) setPlRows(rows);
    });
    return () => {
      isMounted = false;
    };
  }, [session, plStartDate, plEndDate, entriesVersion]);

  useEffect(() => {
    if (!session) return;
    let isMounted = true;
    fetchBalanceSheet(bsAsOfDate).then((rows) => {
      if (isMounted) setBsRows(rows);
    });
    return () => {
      isMounted = false;
    };
  }, [session, bsAsOfDate, entriesVersion]);

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
        // CalendarCard は常時マウントするため renderContent の外側で描画する
        return <GoalCard monthRange={goalMonthRange} refreshSignal={entriesVersion} />;
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
        return null;
    }
  };

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: "#F3F4F6", color: "#111827" }}>
      <header style={{ flexShrink: 0, display: "flex", flexDirection: "column", padding: "10px 20px", borderBottom: "1px solid #E5E7EB", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 16, color: "#4B5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>取引管理ダッシュボード</h1>
          <CommonButton label="ログアウト" sizeVariant="M" colorVariant="secondary" onClick={signOut} />
        </div>
        {/* メモはタブ配下ではなくヘッダーに置き、タブを切り替えても表示と入力内容を保つ */}
        <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#6B7280", flexShrink: 0 }}>メモ</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <TextInput
              placeholder="この端末にのみ保存されます"
              sizeVariant="Full"
              fontSize="S"
              value={memo}
              onChange={handleMemoChange}
            />
          </span>
        </label>
      </header>
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {/*
          CalendarCard は常時マウントし表示のみ切り替える。
          タブを移動して戻ったときに勘定科目フィルタ・表示中の月・選択日がリセットされるのを防ぐ。
        */}
        <div style={{ maxWidth: 900, width: "100%", display: "grid", gap: 24 }}>
          <div style={{ display: activeTab === "transaction" ? "block" : "none" }}>
            <CalendarCard
              onDateDoubleClick={handleDateDoubleClick}
              onEditEntry={handleEditEntry}
              refreshSignal={entriesVersion}
              onEntryChanged={() => setEntriesVersion((v) => v + 1)}
            />
          </div>
          {renderContent()}
        </div>
      </div>
      <nav style={{ flexShrink: 0, display: "flex", flexDirection: "row", overflowX: "auto", borderTop: "1px solid #E5E7EB", background: "#FFFFFF" }}>
        {tabs.map((tab) => (
          <button
            style={{ padding: "20px 24px", minHeight: 60, border: "none", borderBottom: activeTab === tab.id ? "3px solid #3B82F6" : "3px solid transparent", background: activeTab === tab.id ? "#EFF6FF" : "transparent", color: activeTab === tab.id ? "#1F2937" : "#6B7280", fontSize: 15, fontWeight: activeTab === tab.id ? 600 : 400, whiteSpace: "nowrap", minWidth: "fit-content", cursor: "pointer", transition: "all 0.2s ease" }}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
