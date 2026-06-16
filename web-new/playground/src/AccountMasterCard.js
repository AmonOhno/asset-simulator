import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useFinancialStore } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "../../src/components/Card";
import { TextInput } from "../../src/components/TextInput";
import { SelectInput } from "../../src/components/SelectInput";
import { CommonButton } from "../../src/components/CommonButton";
const accountTypes = [
    { label: "資産", value: "Asset" },
    { label: "負債", value: "Liability" },
    { label: "純資産", value: "Equity" },
    { label: "収益", value: "Revenue" },
    { label: "費用", value: "Expense" },
];
const categoryLabel = {
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
    const [category, setCategory] = useState("Asset");
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
        }
        catch (error) {
            console.error("Failed to add journal account:", error);
            alert("勘定科目の追加に失敗しました。通信を確認してください。");
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs(Card, { title: "\u52D8\u5B9A\u79D1\u76EE\u30DE\u30B9\u30BF\u7BA1\u7406", subInfo: `${journalAccounts.length} 件登録済み`, isExpanded: isExpanded, onToggle: () => setIsExpanded((prev) => !prev), children: [_jsx(CardBodyHead, { children: _jsxs("div", { style: { display: "grid", gap: 16 }, children: [_jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsx(TextInput, { placeholder: "\u79D1\u76EE\u540D", value: name, onChange: setName, sizeVariant: "L" }), _jsx(SelectInput, { options: accountTypes, value: category, onChange: (v) => setCategory(v), sizeVariant: "M" })] }), _jsx(CommonButton, { label: busy ? "追加中..." : "勘定科目を追加", onClick: addAccount })] }) }), _jsx(CardBodyMain, { children: _jsxs("div", { style: { display: "grid", gap: 8 }, children: [journalAccounts.length === 0 && (_jsx("div", { style: { color: "#6B7280", fontSize: 14 }, children: "\u767B\u9332\u3055\u308C\u305F\u52D8\u5B9A\u79D1\u76EE\u306F\u3042\u308A\u307E\u305B\u3093\u3002" })), journalAccounts.map((acc) => (_jsxs("div", { style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                padding: "10px 12px",
                                border: "1px solid #E5E7EB",
                                borderRadius: 8,
                                flexWrap: "wrap",
                            }, children: [_jsxs("div", { style: { display: "grid", gap: 2 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: acc.name }), _jsxs("div", { style: { fontSize: 12, color: "#6B7280" }, children: [categoryLabel[acc.category] ?? acc.category, " \u30FB \u6B8B\u9AD8 \u00A5", acc.balance.toLocaleString()] })] }), _jsx(CommonButton, { label: "\u524A\u9664", sizeVariant: "S", fontSize: "S", colorVariant: "secondary", onClick: () => deleteJournalAccount(acc) })] }, acc.id)))] }) })] }));
}
