import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const sizeWidthMap = {
    S: "60px",
    M: "120px",
    L: "160px",
    LL: "200px",
    Full: "100%",
};
const sizeHeightMap = {
    S: "32px",
    M: "48px",
    L: "64px",
    LL: "48px",
    Full: "48px",
};
const fontSizeMap = {
    S: 14,
    M: 16,
    L: 18,
};
const colorStyles = {
    primary: {
        backgroundColor: "#4F46E5",
        color: "#FFFFFF",
        border: "none",
    },
    secondary: {
        backgroundColor: "#FFFFFF",
        color: "#4F46E5",
        border: "1.5px solid #4F46E5",
    },
};
const baseStyle = {
    fontWeight: 700,
    borderRadius: 8,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxSizing: "border-box",
    transition: "opacity 0.15s ease",
};
export function CommonButton({ label, sizeVariant = "M", colorVariant = "primary", fontSize = "M", icon, onClick, }) {
    const style = {
        ...baseStyle,
        ...colorStyles[colorVariant],
        width: sizeWidthMap[sizeVariant],
        height: sizeHeightMap[sizeVariant],
        fontSize: fontSizeMap[fontSize],
    };
    return (_jsxs("button", { type: "button", style: style, onClick: onClick, children: [icon && _jsx("span", { "aria-hidden": "true", children: icon }), label] }));
}
