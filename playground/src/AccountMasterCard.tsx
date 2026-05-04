import { useState } from "react";
import { Card, CardBodyHead, CardBodyMain } from "./components/Card";
import { TextInput } from "./components/TextInput";
import { SelectInput } from "./components/SelectInput";
import { CommonButton } from "./components/CommonButton";
import { DataGrid } from "./components/DataGrid";

interface AccountMaster {
  code: string;
  name: string;
  type: string;
}

const accountTypes = [
  { label: "資産", value: "Asset" },
  { label: "負債", value: "Liability" },
  { label: "収益", value: "Revenue" },
  { label: "費用", value: "Expense" },
];

export function AccountMasterCard() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Asset");
  const [accounts, setAccounts] = useState<AccountMaster[]>([
    { code: "101", name: "現金", type: "Asset" },
    { code: "201", name: "買掛金", type: "Liability" },
    { code: "401", name: "売上", type: "Revenue" },
  ]);

  const addAccount = () => {
    if (!code || !name) {
      return;
    }
    setAccounts((prev) => [...prev, { code, name, type }]);
    setCode("");
    setName("");
  };

  return (
    <Card
      title="勘定科目マスタ管理"
      subInfo={`${accounts.length} 件登録済み`}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <TextInput placeholder="科目コード" value={code} onChange={setCode} sizeVariant="M" />
            <TextInput placeholder="科目名" value={name} onChange={setName} sizeVariant="L" />
            <SelectInput
              options={accountTypes}
              value={type}
              onChange={setType}
              sizeVariant="M"
            />
          </div>
          <CommonButton label="勘定科目を追加" onClick={addAccount} />
        </div>
      </CardBodyHead>
      <CardBodyMain>
        <DataGrid
          data={accounts}
          columns={[
            { label: "コード", key: "code", width: 100 },
            { label: "科目名", key: "name", width: 220 },
            { label: "タイプ", key: "type", width: 120, align: "center" },
          ]}
          colorVariant="gray"
        />
      </CardBodyMain>
    </Card>
  );
}
