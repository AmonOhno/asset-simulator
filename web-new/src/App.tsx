import "./App.css";
import TransactionEntryCard from "./TransactionEntryCard";
import { RecurringTransactionCard } from "./RecurringTransactionCard";
import { TransactionListCard } from "./TransactionListCard";
import { ProfitLossStatementCard } from "./ProfitLossStatementCard";
import { BalanceSheetCard } from "./BalanceSheetCard";
import { AccountMasterCard } from "./AccountMasterCard";


function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F3F4F6",
        padding: 32,
        boxSizing: "border-box",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24 }}>
        <header style={{ display: "grid", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 34 }}>取引管理ダッシュボード</h1>
          <p style={{ margin: 0, color: "#4B5563", fontSize: 16 }}>
            取引入力、定期取引管理、取引一覧リストをカード形式でまとめて確認できます。
          </p>
        </header>

        <section style={{ display: "grid", gap: 24 }}>
          <TransactionEntryCard />
          <RecurringTransactionCard />
          <TransactionListCard />
          <ProfitLossStatementCard />
          <BalanceSheetCard />
          <AccountMasterCard />
        </section>
      </div>
    </main>
  );
}

export default App;
