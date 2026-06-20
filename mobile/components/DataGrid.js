import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const headerColorMap = {
    blue: { backgroundColor: "#EEF2FF", color: "#4F46E5" },
    red: { backgroundColor: "#FEF2F2", color: "#DC2626" },
    gray: { backgroundColor: "#F3F4F6", color: "#374151" },
};
const styles = {
    wrapper: {
        overflowX: "auto",
        width: "100%",
        boxSizing: "border-box",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
    },
    th: {
        height: 40,
        padding: "0 8px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        textAlign: "left",
        borderBottom: "1px solid #E5E7EB",
    },
    td: {
        height: 40,
        padding: "0 8px",
        whiteSpace: "nowrap",
        borderBottom: "1px solid #F3F4F6",
    },
};
export function DataGrid({ data, columns, colorVariant = "gray", }) {
    const headerColor = headerColorMap[colorVariant];
    return (_jsx("div", { style: styles.wrapper, children: _jsxs("table", { style: styles.table, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((col) => (_jsx("th", { style: {
                                ...styles.th,
                                ...headerColor,
                                textAlign: col.align ?? "left",
                                ...(col.width != null ? { width: col.width } : {}),
                            }, children: col.label }, col.key))) }) }), _jsx("tbody", { children: data.map((row, rowIndex) => (_jsx("tr", { children: columns.map((col) => (_jsx("td", { style: {
                                ...styles.td,
                                textAlign: col.align ?? "left",
                            }, children: String(row[col.key] ?? "") }, col.key))) }, rowIndex))) })] }) }));
}
