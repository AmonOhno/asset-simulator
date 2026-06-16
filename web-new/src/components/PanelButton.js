import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const styles = {
    container: {
        width: 358,
        borderRadius: 20,
        border: "1px solid #E5E7EB",
        background: "#FFFFFF",
        padding: "24px 20px",
        textAlign: "left",
        cursor: "pointer",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
        transition: "all 0.2s ease",
    },
    title: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 10,
    },
    value: {
        fontSize: 36,
        fontWeight: 800,
        color: "#0F172A",
    },
    subText: {
        marginTop: 8,
        fontSize: 12,
        color: "#9CA3AF",
    },
    action: {
        marginTop: 8,
        color: "#3B82F6",
        fontWeight: 700,
    },
};
export function PanelButton({ title, value, onClick, subText }) {
    return (_jsxs("button", { type: "button", onClick: onClick, style: styles.container, children: [_jsx("div", { style: styles.title, children: title }), _jsx("div", { style: styles.value, children: value }), subText && _jsx("div", { style: styles.subText, children: subText })] }));
}
