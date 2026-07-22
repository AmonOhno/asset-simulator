import { useEffect, useMemo, useState } from "react";
import { useFinancialStore, todayLocalString } from "@asset-simulator/shared";
import type { CalendarJournalEntry, FrequentEntrySet } from "@asset-simulator/shared";
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
  const getFrequentJournalEntrySets = useFinancialStore((s) => s.getFrequentJournalEntrySets);

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
  // NumericInput は内部 state を持つため、サジェスト適用時は key を変えて再マウントし表示値を反映する
  const [amountFieldKey, setAmountFieldKey] = useState(0);
  const [suggestions, setSuggestions] = useState<FrequentEntrySet[]>([]);

  const accountOptions = useMemo(
    () => [PLACEHOLDER, ...journalAccounts.map((acc) => ({ label: acc.name, value: acc.id }))],
    [journalAccounts]
  );

  const accountNameById = useMemo(
    () => new Map(journalAccounts.map((acc) => [acc.id, acc.name])),
    [journalAccounts]
  );

  // 新規登録モードでは、直近の仕訳から「よく使う取引入力値セット」を取得してサジェストする
  useEffect(() => {
    if (isEditMode) return;
    let isMounted = true;
    getFrequentJournalEntrySets().then((sets) => {
      if (isMounted) setSuggestions(sets);
    });
    return () => {
      isMounted = false;
    };
  }, [isEditMode, getFrequentJournalEntrySets]);

  const applySuggestion = (suggestion: FrequentEntrySet) => {
    setDescription(suggestion.description);
    setDebitAccountId(suggestion.debitAccountId);
    setCreditAccountId(suggestion.creditAccountId);
    setAmount(suggestion.amount);
    setAmountFieldKey((prev) => prev + 1);
  };

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
      setAmountFieldKey((prev) => prev + 1);
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
          {!isEditMode && suggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 13, color: "#6B7280", textAlign: "left" }}>よく使う入力</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {suggestions.map((s) => (
                  <button
                    key={`${s.description}-${s.debitAccountId}-${s.creditAccountId}-${s.amount}`}
                    type="button"
                    onClick={() => applySuggestion(s)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 2,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #BFDBFE",
                      background: "#EFF6FF",
                      color: "#1F2937",
                      fontSize: 13,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {s.description} ¥{s.amount.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 11, color: "#6B7280" }}>
                      {accountNameById.get(s.debitAccountId) ?? "不明"} / {accountNameById.get(s.creditAccountId) ?? "不明"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
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
              key={amountFieldKey}
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
