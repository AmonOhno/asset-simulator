import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const sizeWidthMap = {
    S: "140px",
    M: "160px",
    L: "240px",
    Full: "100%",
};
const sizeHeightMap = {
    S: "32px",
    M: "44px",
    L: "56px",
    Full: "44px",
};
const fontSizeMap = {
    S: 14,
    M: 16,
    L: 18,
};
const styles = {
    wrapper: {
        position: "relative",
        width: "100%",
    },
    select: {
        padding: "0 36px 0 12px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        boxSizing: "border-box",
        width: "100%",
        color: "#333",
        backgroundColor: "#FFFFFF",
        appearance: "none",
        cursor: "pointer",
    },
    icon: {
        position: "absolute",
        right: 12,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
        width: 16,
        height: 16,
    },
};
function ChevronDownIcon() {
    return (_jsx("svg", { style: styles.icon, viewBox: "0 0 24 24", fill: "none", stroke: "#666", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: _jsx("polyline", { points: "6 9 12 15 18 9" }) }));
}
export function SelectInput({ options, value, onChange, sizeVariant = "Full", fontSize = "M" }) {
    const wrapperStyle = {
        ...styles.wrapper,
        width: sizeWidthMap[sizeVariant],
    };
    const selectStyle = {
        ...styles.select,
        height: sizeHeightMap[sizeVariant],
        fontSize: fontSizeMap[fontSize],
    };
    return (_jsxs("div", { style: wrapperStyle, children: [_jsx("select", { value: value, onChange: (e) => onChange(e.target.value), style: selectStyle, children: options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) }), _jsx(ChevronDownIcon, {})] }));
}
