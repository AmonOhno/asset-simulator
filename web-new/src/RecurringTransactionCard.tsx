import { useState } from "react";
import { Card, CardBodyHead, CardBodyMain } from "./components/Card";
import { TextInput } from "./components/TextInput";
import { DateInput } from "./components/DateInput";
import { NumericInput } from "./components/NumericInput";
import { SelectInput } from "./components/SelectInput";
import { CommonButton } from "./components/CommonButton";
import { DataGrid } from "./components/DataGrid";

interface RecurringTransaction {
  name: string;
  startDate: string;
  frequency: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  active: string;
}

const accountOptions = [
  { label: "Cash", value: "Cash" },
  { label: "Rent Expense", value: "Rent Expense" },
  { label: "Utilities", value: "Utilities" },
  { label: "Accounts Payable", value: "Accounts Payable" },
  { label: "Sales", value: "Sales" },
];

const frequencyOptions = [
  { label: "月次", value: "Monthly" },
  { label: "四半期", value: "Quarterly" },
  { label: "年次", value: "Yearly" },
];

const activeOptions = [
  { label: "有効", value: "Active" },
  { label: "無効", value: "Inactive" },
];

export function RecurringTransactionCard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("2026-05-01");
  const [frequency, setFrequency] = useState("Monthly");
  const [debitAccount, setDebitAccount] = useState("Rent Expense");
  const [creditAccount, setCreditAccount] = useState("Cash");
  const [amount, setAmount] = useState(0);
  const [active, setActive] = useState("Active");
  const [items, setItems] = useState<RecurringTransaction[]>([]);

  const addRecurring = () => {
    if (!name || amount <= 0) {
      return;
    }

    setItems((prev) => [
      ...prev,
      { name, startDate, frequency, debitAccount, creditAccount, amount, active },
    ]);

    setName("");
    setAmount(0);
  };

  return (
    <Card
      title="定期取引管理画面"
      subInfo={`${items.length} 件登録されています`}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <SelectInput
                options={activeOptions}
                value={active}
                onChange={setActive}
                sizeVariant="S"
            />
            <SelectInput
              options={frequencyOptions}
              value={frequency}
              onChange={setFrequency}
              sizeVariant="S"
            />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <DateInput value={startDate} onChange={setStartDate} sizeVariant="M" />
            <TextInput
              placeholder="取引名称"
              value={name}
              onChange={setName}
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
          <CommonButton label="定期取引を保存" onClick={addRecurring} />
        </div>
      </CardBodyHead>
      <CardBodyMain>
        <DataGrid
          data={items}
          columns={[
            { label: "名称", key: "name", width: 180 },
            { label: "開始日", key: "startDate", width: 100 },
            { label: "頻度", key: "frequency", width: 100 },
            { label: "借方", key: "debitAccount", width: 120 },
            { label: "貸方", key: "creditAccount", width: 120 },
            { label: "金額", key: "amount", width: 100, align: "right" },
            { label: "状態", key: "active", width: 80, align: "center" },
          ]}
          colorVariant="gray"
        />
      </CardBodyMain>
    </Card>
  );
}
