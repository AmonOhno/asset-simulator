import { useMemo, useState } from "react";
import { useFinancialStore, todayLocalString } from "@asset-simulator/shared";
import type { RecurrenceFrequency, RecurringTransaction } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "@mobile-components/Card";
import { TextInput } from "@mobile-components/TextInput";
import { DateInput } from "@mobile-components/DateInput";
import { NumericInput } from "@mobile-components/NumericInput";
import { SelectInput } from "@mobile-components/SelectInput";
import { CommonButton } from "@mobile-components/CommonButton";
import { Dialog } from "@mobile-components/Dialog";

const PLACEHOLDER = { label: "選択してください", value: "" };

const frequencyOptions: { label: string; value: RecurrenceFrequency }[] = [
  { label: "月次", value: "monthly" },
  { label: "年次", value: "yearly" },
  { label: "都度", value: "free" },
];

const frequencyLabel: Record<string, string> = {
  monthly: "月次",
  yearly: "年次",
  weekly: "週次",
  free: "都度",
};

export function RecurringTransactionCard() {
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);
  const regularJournalEntries = useFinancialStore((s) => s.regularJournalEntries);
  const addRegularJournalEntry = useFinancialStore((s) => s.addRegularJournalEntry);
  const deleteRegularJournalEntry = useFinancialStore((s) => s.deleteRegularJournalEntry);
  const executeRegularJournalEntry = useFinancialStore((s) => s.executeRegularJournalEntry);
  const executeDueRegularJournalEntries = useFinancialStore((s) => s.executeDueRegularJournalEntries);

  const [isExpanded, setIsExpanded] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() => todayLocalString());
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [dateOfMonth, setDateOfMonth] = useState(1);
  const [dateOfYear, setDateOfYear] = useState("01-01");
  const [debitAccountId, setDebitAccountId] = useState("");
  const [creditAccountId, setCreditAccountId] = useState("");
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartDate(todayLocalString());
    setFrequency("monthly");
    setDateOfMonth(1);
    setDateOfYear("01-01");
    setDebitAccountId("");
    setCreditAccountId("");
    setAmount(0);
  };

  const openDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const accountOptions = useMemo(
    () => [PLACEHOLDER, ...journalAccounts.map((acc) => ({ label: acc.name, value: acc.id }))],
    [journalAccounts]
  );
  const accountName = useMemo(() => {
    const map: Record<string, string> = {};
    journalAccounts.forEach((acc) => {
      map[acc.id] = acc.name;
    });
    return map;
  }, [journalAccounts]);

  const addRecurring = async () => {
    if (!name) {
      alert("取引名称を入力してください");
      return;
    }
    if (!debitAccountId) {
      alert("借方勘定科目を選択してください");
      return;
    }
    if (!creditAccountId || creditAccountId === debitAccountId) {
      alert("貸方勘定科目を選択してください（借方と異なる科目）");
      return;
    }
    if (!amount || amount <= 0) {
      alert("金額を正しく入力してください");
      return;
    }
    if (frequency === "monthly" && (dateOfMonth < 1 || dateOfMonth > 31)) {
      alert("月次の場合は実行日(1〜31)を入力してください");
      return;
    }
    if (frequency === "yearly" && !/^\d{2}-\d{2}$/.test(dateOfYear)) {
      alert("年次の場合は実行日(MM-DD)を入力してください");
      return;
    }

    setBusy(true);
    try {
      const entry: Omit<RecurringTransaction, "id"> = {
        name,
        description: description.trim() || name,
        debitAccountId,
        creditAccountId,
        amount,
        frequency,
        startDate,
        dateOfMonth,
        dateOfYear,
        holidayDivOfMonth: "none",
        user_id: "",
      };
      await addRegularJournalEntry(entry);
      closeDialog();
    } catch (error) {
      console.error("Failed to add regular journal entry:", error);
      alert("定期取引の保存に失敗しました。通信を確認してください。");
    } finally {
      setBusy(false);
    }
  };

  const runDue = async () => {
    setBusy(true);
    try {
      const result = await executeDueRegularJournalEntries();
      alert(`期限到来の定期取引を ${result.executed} 件実行しました`);
    } catch (error) {
      console.error("Failed to execute due regular journal entries:", error);
      alert("期限到来分の実行に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card
        title="定期取引管理"
        subInfo={`${regularJournalEntries.length} 件登録されています`}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
      >
        <CardBodyHead>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <CommonButton label="追加" onClick={openDialog} />
            <CommonButton label="期限到来分を実行" colorVariant="secondary" onClick={runDue} />
          </div>
        </CardBodyHead>
        <CardBodyMain>
          <div style={{ display: "grid", gap: 8 }}>
            {regularJournalEntries.length === 0 && (
              <div style={{ color: "#6B7280", fontSize: 14 }}>登録された定期取引はありません。</div>
            )}
            {regularJournalEntries.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    {frequencyLabel[item.frequency] ?? item.frequency} ・ {accountName[item.debitAccountId] ?? item.debitAccountId} / {accountName[item.creditAccountId] ?? item.creditAccountId} ・ ¥{item.amount.toLocaleString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <CommonButton label="実行" sizeVariant="S" fontSize="S" onClick={() => executeRegularJournalEntry(item)} />
                  <CommonButton label="削除" sizeVariant="S" fontSize="S" colorVariant="secondary" onClick={() => deleteRegularJournalEntry(item)} />
                </div>
              </div>
            ))}
          </div>
        </CardBodyMain>
      </Card>

      <Dialog isOpen={isDialogOpen} onClose={closeDialog} title="定期取引の登録">
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, textAlign: "left" }}>周期</div>
              <SelectInput
                options={frequencyOptions}
                value={frequency}
                onChange={(v) => setFrequency(v as RecurrenceFrequency)}
                sizeVariant="S"
              />
            </div>
            {frequency === "monthly" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 14, textAlign: "left" }}>実行日(1〜31)</div>
                <NumericInput value={dateOfMonth} min={1} max={31} onBlur={setDateOfMonth} sizeVariant="S" />
              </div>
            )}
            {frequency === "yearly" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 14, textAlign: "left" }}>実行日(MM-DD)</div>
                <TextInput placeholder="01-01" value={dateOfYear} onChange={setDateOfYear} sizeVariant="S" />
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <DateInput value={startDate} onChange={setStartDate} sizeVariant="M" />
            <TextInput placeholder="取引名称" value={name} onChange={setName} sizeVariant="Full" />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <TextInput placeholder="摘要（未入力時は取引名称を使用）" value={description} onChange={setDescription} sizeVariant="Full" />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div className="column" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, textAlign: "left" }}>借方</div>
              <SelectInput options={accountOptions} value={debitAccountId} onChange={setDebitAccountId} sizeVariant="S" />
            </div>
            <div className="column" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, textAlign: "left" }}>貸方</div>
              <SelectInput options={accountOptions} value={creditAccountId} onChange={setCreditAccountId} sizeVariant="S" />
            </div>
            <NumericInput value={amount} unit="円" onBlur={setAmount} sizeVariant="M" />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <CommonButton label="キャンセル" colorVariant="secondary" onClick={closeDialog} />
            <CommonButton label={busy ? "登録中..." : "登録"} onClick={addRecurring} />
          </div>
        </div>
      </Dialog>
    </>
  );
}
