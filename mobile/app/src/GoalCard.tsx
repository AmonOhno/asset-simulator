import { useEffect, useMemo, useState } from "react";
import { useFinancialStore, todayLocalString, formatDateLocal } from "@asset-simulator/shared";
import type { Goal, GoalPeriod } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "@mobile-components/Card";
import { SelectInput } from "@mobile-components/SelectInput";
import { NumericInput } from "@mobile-components/NumericInput";
import { CommonButton } from "@mobile-components/CommonButton";
import { Dialog } from "@mobile-components/Dialog";

const PLACEHOLDER = { label: "選択してください", value: "" };

const periodOptions: { label: string; value: GoalPeriod }[] = [
  { label: "日次", value: "day" },
  { label: "月次", value: "month" },
];

const periodLabel: Record<GoalPeriod, string> = {
  day: "日次",
  month: "月次",
};

// 目標期間ごとの実績金額 (勘定科目ID -> 実績支出額)
type ActualByAccount = Record<GoalPeriod, Record<string, number>>;

export function GoalCard() {
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);
  const goals = useFinancialStore((s) => s.goals);
  const getGoals = useFinancialStore((s) => s.getGoals);
  const addGoal = useFinancialStore((s) => s.addGoal);
  const updateGoal = useFinancialStore((s) => s.updateGoal);
  const deleteGoal = useFinancialStore((s) => s.deleteGoal);
  const getProfitLossStatementView = useFinancialStore((s) => s.getProfitLossStatementView);

  const [isExpanded, setIsExpanded] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [period, setPeriod] = useState<GoalPeriod>("month");
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actualByAccount, setActualByAccount] = useState<ActualByAccount>({ day: {}, month: {} });

  useEffect(() => {
    getGoals();
  }, [getGoals]);

  // 目標に対する実績支出（当日分・当月分）を取得し、進捗表示に利用する
  useEffect(() => {
    if (goals.length === 0) return;
    let isMounted = true;
    const today = todayLocalString();
    const now = new Date();
    const monthStart = formatDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));

    const toActualMap = (rows: { category: string; accountId: string; sumAmount: number }[]) => {
      const map: Record<string, number> = {};
      rows.filter((r) => r.category === "Expense").forEach((r) => {
        map[r.accountId] = r.sumAmount;
      });
      return map;
    };

    Promise.all([
      getProfitLossStatementView(today, today),
      getProfitLossStatementView(monthStart, today),
    ]).then(([dayRows, monthRows]) => {
      if (!isMounted) return;
      setActualByAccount({ day: toActualMap(dayRows), month: toActualMap(monthRows) });
    });

    return () => {
      isMounted = false;
    };
  }, [goals, getProfitLossStatementView]);

  // 支出目標は費用科目に対して設定する
  const expenseAccountOptions = useMemo(
    () => [
      PLACEHOLDER,
      ...journalAccounts.filter((a) => a.category === "Expense").map((a) => ({ label: a.name, value: a.id })),
    ],
    [journalAccounts]
  );
  const accountName = useMemo(() => {
    const map: Record<string, string> = {};
    journalAccounts.forEach((a) => {
      map[a.id] = a.name;
    });
    return map;
  }, [journalAccounts]);

  const resetForm = () => {
    setAccountId("");
    setPeriod("month");
    setAmount(0);
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const saveGoal = async () => {
    if (!accountId) {
      alert("勘定科目を選択してください");
      return;
    }
    if (!amount || amount <= 0) {
      alert("目標金額を正しく入力してください");
      return;
    }

    setBusy(true);
    try {
      // 同じ勘定科目・期間の目標が既にある場合は金額を更新する
      const existing = goals.find((g) => g.accountId === accountId && g.period === period);
      if (existing) {
        await updateGoal({ ...existing, amount });
      } else {
        const goal: Omit<Goal, "id"> = { accountId, period, amount, userId: "" };
        await addGoal(goal);
      }
      closeDialog();
    } catch (error) {
      console.error("Failed to save goal:", error);
      alert("支出目標の保存に失敗しました。通信を確認してください。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card
        title="支出目標管理"
        subInfo={`${goals.length} 件設定されています`}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
      >
        <CardBodyHead>
          <CommonButton label="目標を設定" onClick={openDialog} />
        </CardBodyHead>
        <CardBodyMain>
          <div style={{ display: "grid", gap: 8 }}>
            {goals.length === 0 && (
              <div style={{ color: "#6B7280", fontSize: 14 }}>設定された支出目標はありません。</div>
            )}
            {goals.map((goal) => {
              const actual = actualByAccount[goal.period]?.[goal.accountId] ?? 0;
              const rate = goal.amount > 0 ? Math.min(actual / goal.amount, 1) : 0;
              const overBudget = actual > goal.amount;
              return (
                <div
                  key={goal.id}
                  style={{
                    display: "grid",
                    gap: 6,
                    padding: "10px 12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "grid", gap: 2 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{accountName[goal.accountId] ?? goal.accountId}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        {periodLabel[goal.period]}目標 ・ ¥{goal.amount.toLocaleString()}
                      </div>
                    </div>
                    <CommonButton
                      label="削除"
                      sizeVariant="S"
                      fontSize="S"
                      colorVariant="secondary"
                      onClick={() => deleteGoal(goal)}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "#E5E7EB", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${rate * 100}%`,
                          height: "100%",
                          background: overBudget ? "#EF4444" : "#3B82F6",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 12, color: overBudget ? "#EF4444" : "#6B7280", whiteSpace: "nowrap" }}>
                      ¥{actual.toLocaleString()} / ¥{goal.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBodyMain>
      </Card>

      <Dialog isOpen={isDialogOpen} onClose={closeDialog} title="支出目標の設定">
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, textAlign: "left" }}>勘定科目</div>
              <SelectInput options={expenseAccountOptions} value={accountId} onChange={setAccountId} sizeVariant="M" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, textAlign: "left" }}>期間</div>
              <SelectInput
                options={periodOptions}
                value={period}
                onChange={(v) => setPeriod(v as GoalPeriod)}
                sizeVariant="S"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <NumericInput value={amount} unit="円" onBlur={setAmount} sizeVariant="M" />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <CommonButton label="キャンセル" colorVariant="secondary" onClick={closeDialog} />
            <CommonButton label={busy ? "保存中..." : "保存"} onClick={saveGoal} />
          </div>
        </div>
      </Dialog>
    </>
  );
}
