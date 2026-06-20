import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useFinancialStore } from "@asset-simulator/shared";
import { Card, CardBodyHead, CardBodyMain } from "@mobile-components/Card";
import { TextInput } from "@mobile-components/TextInput";
import { DateInput } from "@mobile-components/DateInput";
import { NumericInput } from "@mobile-components/NumericInput";
import { SelectInput } from "@mobile-components/SelectInput";
import { CommonButton } from "@mobile-components/CommonButton";
const PLACEHOLDER = { label: "選択してください", value: "" };
const frequencyOptions = [
    { label: "月次", value: "monthly" },
    { label: "年次", value: "yearly" },
    { label: "都度", value: "free" },
];
const frequencyLabel = {
    monthly: "月次",
    yearly: "年次",
    weekly: "週次",
    free: "都度",
};
export function RecurringTransactionCard() {
    const journalAccounts = useFinancialStore((s) => s.journalAccounts);
    const regularJournalEntries = useFinancialStore((s) => s.regularJournalEntries);
    const addRegularJournalEntry = useFinancialStore((s) => s.addRegularJournalEntry);
    const deleteRegularJournalEntry = useFinancialStore((s) => s.deleteRegularJournalEntry);
    const executeRegularJournalEntry = useFinancialStore((s) => s.executeRegularJournalEntry);
    const executeDueRegularJournalEntries = useFinancialStore((s) => s.executeDueRegularJournalEntries);
    const [isExpanded, setIsExpanded] = useState(true);
    const [name, setName] = useState("");
    const [startDate, setStartDate] = useState(() => new Date().toLocaleDateString("sv-SE"));
    const [frequency, setFrequency] = useState("monthly");
    const [dateOfMonth, setDateOfMonth] = useState(1);
    const [dateOfYear, setDateOfYear] = useState("01-01");
    const [debitAccountId, setDebitAccountId] = useState("");
    const [creditAccountId, setCreditAccountId] = useState("");
    const [amount, setAmount] = useState(0);
    const [busy, setBusy] = useState(false);
    const accountOptions = useMemo(() => [PLACEHOLDER, ...journalAccounts.map((acc) => ({ label: acc.name, value: acc.id }))], [journalAccounts]);
    const accountName = useMemo(() => {
        const map = {};
        journalAccounts.forEach((acc) => {
            map[acc.id] = acc.name;
        });
        return map;
    }, [journalAccounts]);
    const addRecurring = async () => {
        if (!name) {
            alert("取引名称を入力してください");
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
        if (frequency === "monthly" && (dateOfMonth < 1 || dateOfMonth > 31)) {
            alert("月次の場合は実行日(1〜31)を入力してください");
            return;
        }
        if (frequency === "yearly" && !/^\d{2}-\d{2}$/.test(dateOfYear)) {
            alert("年次の場合は実行日(MM-DD)を入力してください");
            return;
        }
        setBusy(true);
        try {
            const entry = {
                name,
                description: name,
                debitAccountId,
                creditAccountId,
                amount,
                frequency,
                startDate,
                dateOfMonth,
                dateOfYear,
                holidayDivOfMonth: "none",
                user_id: "",
            };
            await addRegularJournalEntry(entry);
            setName("");
            setAmount(0);
        }
        catch (error) {
            console.error("Failed to add regular journal entry:", error);
            alert("定期取引の保存に失敗しました。通信を確認してください。");
        }
        finally {
            setBusy(false);
        }
    };
    const runDue = async () => {
        setBusy(true);
        try {
            const result = await executeDueRegularJournalEntries();
            alert(`期限到来の定期取引を ${result.executed} 件実行しました`);
        }
        catch (error) {
            console.error("Failed to execute due regular journal entries:", error);
            alert("期限到来分の実行に失敗しました。");
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs(Card, { title: "\u5B9A\u671F\u53D6\u5F15\u7BA1\u7406", subInfo: `${regularJournalEntries.length} 件登録されています`, isExpanded: isExpanded, onToggle: () => setIsExpanded((prev) => !prev), children: [_jsx(CardBodyHead, { children: _jsxs("div", { style: { display: "grid", gap: 16 }, children: [_jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }, children: [_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsx("div", { style: { fontSize: 14, textAlign: "left" }, children: "\u5468\u671F" }), _jsx(SelectInput, { options: frequencyOptions, value: frequency, onChange: (v) => setFrequency(v), sizeVariant: "S" })] }), frequency === "monthly" && (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsx("div", { style: { fontSize: 14, textAlign: "left" }, children: "\u5B9F\u884C\u65E5(1\u301C31)" }), _jsx(NumericInput, { value: dateOfMonth, min: 1, max: 31, onBlur: setDateOfMonth, sizeVariant: "S" })] })), frequency === "yearly" && (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsx("div", { style: { fontSize: 14, textAlign: "left" }, children: "\u5B9F\u884C\u65E5(MM-DD)" }), _jsx(TextInput, { placeholder: "01-01", value: dateOfYear, onChange: setDateOfYear, sizeVariant: "S" })] }))] }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsx(DateInput, { value: startDate, onChange: setStartDate, sizeVariant: "M" }), _jsx(TextInput, { placeholder: "\u53D6\u5F15\u540D\u79F0", value: name, onChange: setName, sizeVariant: "Full" })] }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsxs("div", { className: "column", style: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsx("div", { style: { fontSize: 14, textAlign: "left" }, children: "\u501F\u65B9" }), _jsx(SelectInput, { options: accountOptions, value: debitAccountId, onChange: setDebitAccountId, sizeVariant: "S" })] }), _jsxs("div", { className: "column", style: { display: "flex", flexDirection: "column", gap: 4 }, children: [_jsx("div", { style: { fontSize: 14, textAlign: "left" }, children: "\u8CB8\u65B9" }), _jsx(SelectInput, { options: accountOptions, value: creditAccountId, onChange: setCreditAccountId, sizeVariant: "S" })] }), _jsx(NumericInput, { value: amount, unit: "\u5186", onBlur: setAmount, sizeVariant: "M" })] }), _jsxs("div", { style: { display: "flex", gap: 12, flexWrap: "wrap" }, children: [_jsx(CommonButton, { label: busy ? "処理中..." : "定期取引を保存", onClick: addRecurring }), _jsx(CommonButton, { label: "\u671F\u9650\u5230\u6765\u5206\u3092\u5B9F\u884C", colorVariant: "secondary", onClick: runDue })] })] }) }), _jsx(CardBodyMain, { children: _jsxs("div", { style: { display: "grid", gap: 8 }, children: [regularJournalEntries.length === 0 && (_jsx("div", { style: { color: "#6B7280", fontSize: 14 }, children: "\u767B\u9332\u3055\u308C\u305F\u5B9A\u671F\u53D6\u5F15\u306F\u3042\u308A\u307E\u305B\u3093\u3002" })), regularJournalEntries.map((item) => (_jsxs("div", { style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                padding: "10px 12px",
                                border: "1px solid #E5E7EB",
                                borderRadius: 8,
                                flexWrap: "wrap",
                            }, children: [_jsxs("div", { style: { display: "grid", gap: 2 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: item.name }), _jsxs("div", { style: { fontSize: 12, color: "#6B7280" }, children: [frequencyLabel[item.frequency] ?? item.frequency, " \u30FB ", accountName[item.debitAccountId] ?? item.debitAccountId, " / ", accountName[item.creditAccountId] ?? item.creditAccountId, " \u30FB \u00A5", item.amount.toLocaleString()] })] }), _jsxs("div", { style: { display: "flex", gap: 8 }, children: [_jsx(CommonButton, { label: "\u5B9F\u884C", sizeVariant: "S", fontSize: "S", onClick: () => executeRegularJournalEntry(item) }), _jsx(CommonButton, { label: "\u524A\u9664", sizeVariant: "S", fontSize: "S", colorVariant: "secondary", onClick: () => deleteRegularJournalEntry(item) })] })] }, item.id)))] }) })] }));
}
