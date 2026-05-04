import { useMemo, useState } from "react";
import { Card, CardBodyHead, CardBodyMain } from "./components/Card";
import { DataGrid } from "./components/DataGrid";
import { getTransactionsForDate } from "./data/financial";

interface CalendarCardProps {
  onDateDoubleClick?: (date: string) => void;
  onDateSelect?: (date: string) => void;
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

export default function CalendarCard({ onDateDoubleClick, onDateSelect }: CalendarCardProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const today = new Date();
  const currentMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const [selectedDate, setSelectedDate] = useState(() => today.toLocaleDateString('sv-SE'));

  const days = useMemo(() => getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth()), [currentMonth]);
  const firstWeekday = currentMonth.getDay();

  const selected = selectedDate;

  // 選択された日付の取引数を取得
  const transactionCount = getTransactionsForDate(selected).length;
    const filtered = useMemo(() => getTransactionsForDate(selected), [selected]);

  return (
    <Card
      title="取引カレンダー"
      subInfo={`選択日: ${selected} (${transactionCount}件)`}
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
            const iso = date.toLocaleDateString('sv-SE');
            const isToday = iso === today.toLocaleDateString('sv-SE');
            const isSelected = iso === selected;
            const dayTransactionCount = getTransactionsForDate(iso).length;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => {
                  setSelectedDate(iso);
                  onDateSelect?.(iso);
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
                <DataGrid
                  data={filtered}
                  columns={[
                    // { label: "日付", key: "date", width: 100 },
                    { label: "摘要", key: "description", width: 160 },
                    { label: "借方", key: "debitAccount", width: 140 },
                    { label: "貸方", key: "creditAccount", width: 140 },
                    { label: "金額", key: "amount", width: 120, align: "right" },
                  ]}
                  colorVariant="gray"
                />
        
          選択した日付の取引を入力・確認できます。ダブルタップで取引入力へ。
        </div>
      </CardBodyMain>
    </Card>
  );
}
