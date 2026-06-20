import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useFinancialStore } from "@asset-simulator/shared";
import { Card, CardBodyMain } from "../../src/components/Card";
import { DateInput } from "../../src/components/DateInput";
import { TextInput } from "../../src/components/TextInput";
import { SelectInput } from "../../src/components/SelectInput";
import { NumericInput } from "../../src/components/NumericInput";
import { CommonButton } from "../../src/components/CommonButton";
const PLACEHOLDER = { label: "選択してください", value: "" };
export default function TransactionEntryCard({ selectedDate, onEntryAdded }) {
    const journalAccounts = useFinancialStore((s) => s.journalAccounts);
    const addJournalEntry = useFinancialStore((s) => s.addJournalEntry);
    const getJournalAccounts = useFinancialStore((s) => s.getJournalAccounts);
    const [isExpanded, setIsExpanded] = useState(true);
    const [date, setDate] = useState(() => selectedDate ?? new Date().toLocaleDateString("sv-SE"));
    const [description, setDescription] = useState("");
    const [debitAccountId, setDebitAccountId] = useState("");
    const [creditAccountId, setCreditAccountId] = useState("");
    const [amount, setAmount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [count, setCount] = useState(0);
    const accountOptions = useMemo(() => [PLACEHOLDER, ...journalAccounts.map((acc) => ({ label: acc.name, value: acc.id }))], [journalAccounts]);
    const registerEntry = async () => {
        if (!date) {
            alert("日付を入力してください");
            return;
        }
        if (!description) {
            alert("摘要を入力してください");
            return;
        }
        if (!debitAccountId) {
            alert("借方勘定科目を選択してください");
            return;
        }
        if (!creditAccountId || creditAccountId === debitAccountId) {
            alert("貸方勘定科目を選択してください（借方と異なる科目）");
            return;
        }
        if (!amount || amount <= 0) {
            alert("金額を正しく入力してください");
            return;
        }
        setSubmitting(true);
        try {
            await addJournalEntry({ date, description, debitAccountId, creditAccountId, amount, user_id: "" });
            // 変更したリソースのみリフレッシュ（勘定科目の残高更新）
            await getJournalAccounts();
            onEntryAdded?.();
            setDescription("");
            setAmount(0);
            setCount((prev) => prev + 1);
        }
        catch (error) {
            console.error("Failed to register journal entry:", error);
            alert("取引の登録に失敗しました。通信を確認してください。");
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx(Card, { title: `${date} の取引入力`, subInfo: `${count} 件登録済み`, isExpanded: isExpanded, onToggle: () => setIsExpanded((prev) => !prev), children: _jsx(CardBodyMain, { children: _jsxs("div", { style: { display: "grid", gap: 12 }, children: [_jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsx(DateInput, { value: date, onChange: setDate, sizeVariant: "M" }), _jsx(TextInput, { placeholder: "\u6458\u8981", value: description, onChange: setDescription, sizeVariant: "Full" })] }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsxs("div", { className: "column", style: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsx("div", { style: { fontSize: 14, textAlign: "left" }, children: "\u501F\u65B9" }), _jsx(SelectInput, { options: accountOptions, value: debitAccountId, onChange: setDebitAccountId, sizeVariant: "S" })] }), _jsxs("div", { className: "column", style: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsx("div", { style: { fontSize: 14, textAlign: "left" }, children: "\u8CB8\u65B9" }), _jsx(SelectInput, { options: accountOptions, value: creditAccountId, onChange: setCreditAccountId, sizeVariant: "S" })] }), _jsx(NumericInput, { value: amount, unit: "\u5186", onBlur: setAmount, sizeVariant: "M" })] }), _jsx(CommonButton, { label: submitting ? "登録中..." : "登録", sizeVariant: "S", onClick: registerEntry })] }) }) }));
}
