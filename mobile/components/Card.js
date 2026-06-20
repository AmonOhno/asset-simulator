import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const styles = {
    container: {
        width: 358,
        borderRadius: 12,
        background: "#FFFFFF",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
        boxSizing: "border-box",
        overflow: "hidden",
    },
    header: {
        height: 32,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 12px",
        cursor: "pointer",
        userSelect: "none",
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: "#333",
        margin: 0,
    },
    headerSubInfo: {
        fontSize: 13,
        color: "#888",
        margin: 0,
    },
    chevron: {
        fontSize: 12,
        color: "#888",
        marginLeft: 8,
        transition: "transform 0.2s ease",
    },
    body: {
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
};
export function CardBodyHead({ children }) {
    return _jsx("div", { children: children });
}
export function CardBodyMain({ children }) {
    return _jsx("div", { children: children });
}
export function Card({ isExpanded, onToggle, title, subInfo, maxHeight, children, }) {
    const containerStyle = {
        ...styles.container,
        ...(maxHeight != null ? { maxHeight } : {}),
    };
    const bodyStyle = {
        ...styles.body,
        ...(typeof maxHeight === 'number' ? { overflowY: "auto", flex: 1 } : {}),
    };
    if (!isExpanded) {
        return (_jsx("div", { style: containerStyle, children: _jsxs("div", { style: styles.header, onClick: onToggle, role: "button", tabIndex: 0, onKeyDown: (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }, "aria-expanded": isExpanded, children: [_jsx("span", { style: styles.headerTitle, children: title }), _jsxs("span", { children: [subInfo && _jsx("span", { style: styles.headerSubInfo, children: subInfo }), _jsx("span", { style: {
                                    ...styles.chevron,
                                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                }, children: "\u25BC" })] })] }) }));
    }
    return (_jsxs("div", { style: containerStyle, children: [_jsxs("div", { style: styles.header, onClick: onToggle, role: "button", tabIndex: 0, onKeyDown: (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onToggle();
                    }
                }, "aria-expanded": isExpanded, children: [_jsx("span", { style: styles.headerTitle, children: title }), _jsxs("span", { children: [subInfo && _jsx("span", { style: styles.headerSubInfo, children: subInfo }), _jsx("span", { style: {
                                    ...styles.chevron,
                                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                }, children: "\u25BC" })] })] }), _jsx("div", { style: bodyStyle, children: children })] }));
}
