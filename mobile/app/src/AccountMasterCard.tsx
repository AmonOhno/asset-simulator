import { useState } from "react";
import { useFinancialStore } from "@asset-simulator/shared";
import type { AccountCategory } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "@mobile-components/Card";
import { TextInput } from "@mobile-components/TextInput";
import { SelectInput } from "@mobile-components/SelectInput";
import { CommonButton } from "@mobile-components/CommonButton";

const accountTypes: { label: string; value: AccountCategory }[] = [
  { label: "資産", value: "Asset" },
  { label: "負債", value: "Liability" },
  { label: "純資産", value: "Equity" },
  { label: "収益", value: "Revenue" },
  { label: "費用", value: "Expense" },
];

const categoryLabel: Record<string, string> = {
  Asset: "資産",
  Liability: "負債",
  Equity: "純資産",
  Revenue: "収益",
  Expense: "費用",
};

export function AccountMasterCard() {
  const journalAccounts = useFinancialStore((s) => s.journalAccounts);
  const addJournalAccount = useFinancialStore((s) => s.addJournalAccount);
  const deleteJournalAccount = useFinancialStore((s) => s.deleteJournalAccount);

  const [isExpanded, setIsExpanded] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<AccountCategory>("Asset");
  const [busy, setBusy] = useState(false);

  const addAccount = async () => {
    if (!name) {
      alert("勘定科目名を入力してください");
      return;
    }
    setBusy(true);
    try {
      await addJournalAccount({ name, category, balance: 0, user_id: "" });
      setName("");
    } catch (error) {
      console.error("Failed to add journal account:", error);
      alert("勘定科目の追加に失敗しました。通信を確認してください。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="勘定科目マスタ管理"
      subInfo={`${journalAccounts.length} 件登録済み`}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((prev) => !prev)}
    >
      <CardBodyHead>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <TextInput placeholder="科目名" value={name} onChange={setName} sizeVariant="L" />
            <SelectInput
              options={accountTypes}
              value={category}
              onChange={(v) => setCategory(v as AccountCategory)}
              sizeVariant="M"
            />
          </div>
          <CommonButton label={busy ? "追加中..." : "勘定科目を追加"} onClick={addAccount} />
        </div>
      </CardBodyHead>
      <CardBodyMain>
        <div style={{ display: "grid", gap: 8 }}>
          {journalAccounts.length === 0 && (
            <div style={{ color: "#6B7280", fontSize: 14 }}>登録された勘定科目はありません。</div>
          )}
          {journalAccounts.map((acc) => (
            <div
              key={acc.id}
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>{acc.name}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {categoryLabel[acc.category] ?? acc.category}
                </div>
              </div>
              <CommonButton
                label="削除"
                sizeVariant="S"
                fontSize="S"
                colorVariant="secondary"
                onClick={() => deleteJournalAccount(acc)}
              />
            </div>
          ))}
        </div>
      </CardBodyMain>
    </Card>
  );
}
