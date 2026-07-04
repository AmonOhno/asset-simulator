import { useMemo, useState } from "react";
import { useFinancialStore, todayLocalString } from "@asset-simulator/shared";
import type { CalendarJournalEntry } from "@asset-simulator/shared";
import { Card, CardBodyMain } from "@mobile-components/Card";
import { DateInput } from "@mobile-components/DateInput";
import { TextInput } from "@mobile-components/TextInput";
import { SelectInput } from "@mobile-components/SelectInput";
import { NumericInput } from "@mobile-components/NumericInput";
import { CommonButton } from "@mobile-components/CommonButton";

interface TransactionEntryCardProps {
  selectedDate?: string | null;
  /** 指定された場合は編集モードになり、登録の代わりに更新を行う */
  entry?: CalendarJournalEntry | null;
  onEntryAdded?: () => void;
  onEntryUpdated?: () => void;
}

const PLACEHOLDER = { label: "選択してください", value: "" };

export default function TransactionEntryCard({
  selectedDate,
  entry,
  onEntryAdded,
  onEntryUpdated,
}: TransactionEntryCardProps) {
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);
  const addJournalEntry = useFinancialStore((s) => s.addJournalEntry);
  const updateJournalEntry = useFinancialStore((s) => s.updateJournalEntry);
  const getJournalAccounts = useFinancialStore((s) => s.getJournalAccounts);

  const isEditMode = entry != null;

  const [isExpanded, setIsExpanded] = useState(true);
  const [date, setDate] = useState(
    () => entry?.date ?? selectedDate ?? todayLocalString()
  );
  const [description, setDescription] = useState(() => entry?.description ?? "");
  const [debitAccountId, setDebitAccountId] = useState(() => entry?.debitAccountId ?? "");
  const [creditAccountId, setCreditAccountId] = useState(() => entry?.creditAccountId ?? "");
  const [amount, setAmount] = useState(() => entry?.amount ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(0);

  const accountOptions = useMemo(
    () => [PLACEHOLDER, ...journalAccounts.map((acc) => ({ label: acc.name, value: acc.id }))],
    [journalAccounts]
  );

  const validate = () => {
    if (!date) {
      alert("日付を入力してください");
      return false;
    }
    if (!description) {
      alert("摘要を入力してください");
      return false;
    }
    if (!debitAccountId) {
      alert("借方勘定科目を選択してください");
      return false;
    }
    if (!creditAccountId || creditAccountId === debitAccountId) {
      alert("貸方勘定科目を選択してください（借方と異なる科目）");
      return false;
    }
    if (!amount) {
      alert("金額を入力してください（0 以外）");
      return false;
    }
    return true;
  };

  const registerEntry = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      await addJournalEntry({ date, description, debitAccountId, creditAccountId, amount, user_id: "" });
      // 変更したリソースのみリフレッシュ（勘定科目の残高更新）
      await getJournalAccounts();
      onEntryAdded?.();
      setDescription("");
      setAmount(0);
      setCount((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to register journal entry:", error);
      alert("取引の登録に失敗しました。通信を確認してください。");
    } finally {
      setSubmitting(false);
    }
  };

  const updateEntry = async () => {
    if (!entry || !validate()) return;

    setSubmitting(true);
    try {
      await updateJournalEntry({
        id: entry.id,
        date,
        description,
        debitAccountId,
        creditAccountId,
        amount,
        user_id: entry.userId,
      });
      // 変更したリソースのみリフレッシュ（勘定科目の残高更新）
      await getJournalAccounts();
      onEntryUpdated?.();
    } catch (error) {
      console.error("Failed to update journal entry:", error);
      alert("取引の更新に失敗しました。通信を確認してください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title={isEditMode ? `${date} の取引編集` : `${date} の取引入力`}
      subInfo={isEditMode ? undefined : `${count} 件登録済み`}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyMain>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <DateInput value={date} onChange={setDate} sizeVariant="M" />
            <TextInput
              placeholder="摘要"
              value={description}
              onChange={setDescription}
              sizeVariant="Full"
            />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div className="column" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, textAlign: "left" }}>借方</div>
              <SelectInput
                options={accountOptions}
                value={debitAccountId}
                onChange={setDebitAccountId}
                sizeVariant="S"
              />
            </div>
            <div className="column" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 14, textAlign: "left" }}>貸方</div>
              <SelectInput
                options={accountOptions}
                value={creditAccountId}
                onChange={setCreditAccountId}
                sizeVariant="S"
              />
            </div>
            <NumericInput
              value={amount}
              unit="円"
              placeholder="0"
              allowNegative
              onBlur={setAmount}
              sizeVariant="M"
            />
          </div>
          <CommonButton
            label={
              isEditMode
                ? submitting
                  ? "更新中..."
                  : "更新"
                : submitting
                  ? "登録中..."
                  : "登録"
            }
            sizeVariant="S"
            onClick={isEditMode ? updateEntry : registerEntry}
          />
        </div>
      </CardBodyMain>
    </Card>
  );
}
