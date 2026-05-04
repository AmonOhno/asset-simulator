import { useMemo, useState } from "react";
import { Card, CardBodyHead, CardBodyMain } from "./components/Card";
import { TextInput } from "./components/TextInput";
import { DateInput } from "./components/DateInput";
import { CommonButton } from "./components/CommonButton";
import { DataGrid } from "./components/DataGrid";

interface TransactionSummary {
  date: string;
  description: string;
  account: string;
  type: string;
  amount: number;
}

const sampleTransactions: TransactionSummary[] = [
  { date: "2026-05-01", description: "売上計上", account: "Sales", type: "貸方", amount: 220000 },
  { date: "2026-05-02", description: "給与支払", account: "Cash", type: "借方", amount: 120000 },
  { date: "2026-05-05", description: "家賃支払", account: "Rent Expense", type: "借方", amount: 60000 },
  { date: "2026-05-07", description: "支払手数料", account: "Utilities", type: "借方", amount: 8000 },
  { date: "2026-05-10", description: "仕入れ", account: "Accounts Payable", type: "貸方", amount: 150000 },
];

export function TransactionListCard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-31");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      sampleTransactions.filter((item) => {
        const dateMatch = item.date >= startDate && item.date <= endDate;
        const searchMatch =
          search === "" ||
          item.description.includes(search) ||
          item.account.includes(search);
        return dateMatch && searchMatch;
      }),
    [startDate, endDate, search]
  );

  return (
    <Card
      title="取引一覧リスト画面"
      subInfo={`${filtered.length} 件表示`}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <DateInput value={startDate} onChange={setStartDate} sizeVariant="S" />
          <span style={{ alignSelf: "center" }}>~</span>
          <DateInput value={endDate} onChange={setEndDate} sizeVariant="S" />
          <TextInput
            placeholder="検索キーワード"
            value={search}
            onChange={setSearch}
            sizeVariant="L"
          />
          <CommonButton label="絞り込む" onClick={() => undefined} />
        </div>
      </CardBodyHead>
      <CardBodyMain>
        <DataGrid
          data={filtered}
          columns={[
            { label: "日付", key: "date", width: 100 },
            { label: "摘要", key: "description", width: 160 },
            { label: "勘定科目", key: "account", width: 140 },
            { label: "区分", key: "type", width: 80, align: "center" },
            { label: "金額", key: "amount", width: 120, align: "right" },
          ]}
          colorVariant="gray"
        />
      </CardBodyMain>
    </Card>
  );
}
