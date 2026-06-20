import { useEffect, useMemo, useState } from "react";
import { useFinancialStore } from "@asset-simulator/shared";
import type { CalendarJournalEntry } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "@mobile-components/Card";
import { TextInput } from "@mobile-components/TextInput";
import { SelectInput } from "@mobile-components/SelectInput";
import { NumericInput } from "@mobile-components/NumericInput";
import { CommonButton } from "@mobile-components/CommonButton";

interface CalendarCardProps {
  onDateDoubleClick?: (date: string) => void;
  onDateSelect?: (date: string) => void;
  /** 値が変わると当月の取引を再取得する（取引登録後の即時反映用） */
  refreshSignal?: number;
  onEntryChanged?: () => void;
}

function fmt(date: Date): string {
  return date.toLocaleDateString("sv-SE");
}

function getMonthDays(year: number, month: number) {
  const end = new Date(year, month + 1, 0);
  const days = [];
  for (let day = 1; day <= end.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }
  return days;
}

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function getWeekdayLabels() {
  return ["日", "月", "火", "水", "木", "金", "土"];
}

const PLACEHOLDER = { label: "選択してください", value: "" };

export default function CalendarCard({ onDateDoubleClick, onDateSelect, refreshSignal, onEntryChanged }: CalendarCardProps) {
  const getCalendarJournalEntries = useFinancialStore((s) => s.getCalendarJournalEntries);
  const updateJournalEntry = useFinancialStore((s) => s.updateJournalEntry);
  const deleteJournalEntry = useFinancialStore((s) => s.deleteJournalEntry);
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);

  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const [selectedDate, setSelectedDate] = useState(() => fmt(today));
  const [entries, setEntries] = useState<CalendarJournalEntry[]>([]);

  const monthStart = fmt(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
  const monthEnd = fmt(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editDebitAccountId, setEditDebitAccountId] = useState("");
  const [editCreditAccountId, setEditCreditAccountId] = useState("");
  const [editAmount, setEditAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  const accountOptions = useMemo(
    () => [PLACEHOLDER, ...journalAccounts.map((acc) => ({ label: acc.name, value: acc.id }))],
    [journalAccounts]
  );

  const refreshEntries = async () => {
    const rows = await getCalendarJournalEntries(monthStart, monthEnd);
    setEntries(rows);
  };

  useEffect(() => {
    let isMounted = true;
    getCalendarJournalEntries(monthStart, monthEnd).then((rows) => {
      if (isMounted) setEntries(rows);
    });
    return () => {
      isMounted = false;
    };
  }, [monthStart, monthEnd, refreshSignal, getCalendarJournalEntries]);

  const days = getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstWeekday = currentMonth.getDay();
  const selected = selectedDate;

  const countByDate = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => {
      map[e.date] = (map[e.date] ?? 0) + 1;
    });
    return map;
  }, [entries]);

  const filteredEntries = useMemo(
    () => entries.filter((e) => e.date === selected),
    [entries, selected]
  );

  const startEdit = (entry: CalendarJournalEntry) => {
    setEditingId(entry.id);
    setEditDescription(entry.description);
    setEditDebitAccountId(entry.debitAccountId);
    setEditCreditAccountId(entry.creditAccountId);
    setEditAmount(entry.amount);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (entry: CalendarJournalEntry) => {
    if (!editDebitAccountId || !editCreditAccountId || editDebitAccountId === editCreditAccountId) {
      alert("借方・貸方に異なる勘定科目を選択してください");
      return;
    }
    if (!editAmount || editAmount <= 0) {
      alert("金額を正しく入力してください");
      return;
    }
    setSaving(true);
    try {
      await updateJournalEntry({
        id: entry.id,
        date: entry.date,
        description: editDescription,
        debitAccountId: editDebitAccountId,
        creditAccountId: editCreditAccountId,
        amount: editAmount,
        user_id: entry.userId,
      });
      setEditingId(null);
      await refreshEntries();
      onEntryChanged?.();
    } catch {
      alert("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: CalendarJournalEntry) => {
    if (!confirm("この取引を削除しますか？")) return;
    try {
      await deleteJournalEntry({
        id: entry.id,
        date: entry.date,
        description: entry.description,
        debitAccountId: entry.debitAccountId,
        creditAccountId: entry.creditAccountId,
        amount: entry.amount,
        user_id: entry.userId,
      });
      await refreshEntries();
      onEntryChanged?.();
    } catch {
      alert("削除に失敗しました");
    }
  };

  return (
    <Card
      title="取引カレンダー"
      subInfo={`選択日: ${selected} (${filteredEntries.length}件)`}
      isExpanded
      onToggle={() => undefined}
    >
      <CardBodyHead>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setMonthOffset((prev) => prev - 1)}
            style={{
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            前月
          </button>
          <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.3, textAlign: "center", flex: 1 }}>
            {formatMonthLabel(currentMonth)}
          </div>
          <button
            type="button"
            onClick={() => setMonthOffset((prev) => prev + 1)}
            style={{
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            次月
          </button>
        </div>
      </CardBodyHead>
      <CardBodyMain>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 8,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {getWeekdayLabels().map((label) => (
            <div key={label} style={{ color: "#6B7280", fontSize: 13, fontWeight: 700 }}>
              {label}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {Array.from({ length: firstWeekday }).map((_, index) => (
            <div key={`blank-${index}`} />
          ))}
          {days.map((date) => {
            const iso = fmt(date);
            const isToday = iso === fmt(today);
            const isSelected = iso === selected;
            const dayTransactionCount = countByDate[iso] ?? 0;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  setSelectedDate(iso);
                  onDateSelect?.(iso);
                  setEditingId(null);
                }}
                onDoubleClick={() => onDateDoubleClick?.(iso)}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "12px 0",
                  background: isSelected ? "#3B82F6" : isToday ? "#EFF6FF" : "#FFFFFF",
                  color: isSelected ? "#FFFFFF" : "#111827",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {date.getDate()}
                {dayTransactionCount > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isSelected ? "#FFFFFF" : "#3B82F6",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 16, fontSize: 14, color: "#4B5563" }}>
          {filteredEntries.length === 0 ? (
            <div style={{ color: "#9CA3AF", fontSize: 13 }}>この日の取引はありません。下の「取引入力」から登録できます。</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filteredEntries.map((entry) =>
                editingId === entry.id ? (
                  <div
                    key={entry.id}
                    style={{
                      border: "1.5px solid #3B82F6",
                      borderRadius: 8,
                      padding: 12,
                      display: "grid",
                      gap: 8,
                      background: "#F0F7FF",
                    }}
                  >
                    <TextInput placeholder="摘要" value={editDescription} onChange={setEditDescription} sizeVariant="Full" />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>借方</div>
                        <SelectInput options={accountOptions} value={editDebitAccountId} onChange={setEditDebitAccountId} sizeVariant="S" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>貸方</div>
                        <SelectInput options={accountOptions} value={editCreditAccountId} onChange={setEditCreditAccountId} sizeVariant="S" />
                      </div>
                      <NumericInput value={editAmount} unit="円" onBlur={setEditAmount} sizeVariant="M" />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <CommonButton label={saving ? "保存中..." : "保存"} sizeVariant="M" onClick={() => handleUpdate(entry)} />
                      <CommonButton label="キャンセル" sizeVariant="M" colorVariant="secondary" onClick={cancelEdit} />
                    </div>
                  </div>
                ) : (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "8px 4px",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.description}</div>
                      <div style={{ color: "#6B7280", fontSize: 12 }}>{entry.debitAccountName} → {entry.creditAccountName}</div>
                      <div style={{ color: "#374151", fontSize: 13 }}>¥{entry.amount.toLocaleString()}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <CommonButton label="編集" sizeVariant="S" fontSize="S" colorVariant="secondary" onClick={() => startEdit(entry)} />
                      <CommonButton label="削除" sizeVariant="S" fontSize="S" colorVariant="secondary" onClick={() => handleDelete(entry)} />
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </CardBodyMain>
    </Card>
  );
}
