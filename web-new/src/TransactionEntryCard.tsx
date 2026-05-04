import { useState } from "react";
import { Card, CardBodyHead, CardBodyMain } from "./components/Card";
import { DateInput } from "./components/DateInput";
import { TextInput } from "./components/TextInput";
import { SelectInput } from "./components/SelectInput";
import { NumericInput } from "./components/NumericInput";
import { CommonButton } from "./components/CommonButton";
import { DataGrid } from "./components/DataGrid";

interface TransactionEntry {
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
}

const accountOptions = [
  { label: "現金", value: "Cash" },
  { label: "売上高", value: "Sales" },
  { label: "支払家賃", value: "Rent Expense" },
  { label: "通信費", value: "Utilities" },
  { label: "買掛金", value: "Accounts Payable" },
];

export default function TransactionEntryCard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [date, setDate] = useState("2026-05-01");
  const [description, setDescription] = useState("");
  const [debitAccount, setDebitAccount] = useState("Cash");
  const [creditAccount, setCreditAccount] = useState("Sales");
  const [amount, setAmount] = useState(0);
  const [entries, setEntries] = useState<TransactionEntry[]>([]);

  const registerEntry = () => {
    if (!description || amount <= 0) {
      return;
    }

    setEntries((prev) => [
      ...prev,
      { date, description, debitAccount, creditAccount, amount },
    ]);

    setDescription("");
    setAmount(0);
  };

  return (
    <Card
      title="取引入力画面"
      subInfo={`${entries.length} 件の登録`}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
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
                <div style={{fontSize: 14, textAlign: "left"}}>借方</div>
                <SelectInput
                options={accountOptions}
                value={debitAccount}
                onChange={setDebitAccount}
                sizeVariant="S"
                />
            </div>
            <div className="column" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{fontSize: 14, textAlign: "left"}}>借方</div>
                <SelectInput
                options={accountOptions}
                value={creditAccount}
                onChange={setCreditAccount}
                sizeVariant="S"
                />
            </div>
            <NumericInput
              value={amount}
              unit="円"
              onBlur={setAmount}
              sizeVariant="M"
            />
          </div>
          <CommonButton label="登録" sizeVariant="S" onClick={registerEntry} />
        </div>
      </CardBodyHead>
      <CardBodyMain>
        <DataGrid
          data={entries}
          columns={[
            { label: "日付", key: "date", width: 100 },
            { label: "摘要", key: "description", width: 180 },
            { label: "借方", key: "debitAccount", width: 140 },
            { label: "貸方", key: "creditAccount", width: 140 },
            { label: "金額", key: "amount", width: 120, align: "right" },
          ]}
          colorVariant="gray"
        />
      </CardBodyMain>
    </Card>
  );
}
