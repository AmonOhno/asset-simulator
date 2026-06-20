import { jsx as _jsx } from "react/jsx-runtime";
const sizeWidthMap = {
    S: "120px",
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
    input: {
        fontSize: 16,
        padding: "0 12px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        boxSizing: "border-box",
        color: "#333",
        backgroundColor: "#FFFFFF",
    },
    placeholder: {
        color: "#888",
    },
};
export function TextInput({ placeholder, sizeVariant = "Full", fontSize = "M", value, onBlur, onChange, }) {
    const inputStyle = {
        ...styles.input,
        width: sizeWidthMap[sizeVariant],
        height: sizeHeightMap[sizeVariant],
        fontSize: fontSizeMap[fontSize],
    };
    return (_jsx("input", { type: "text", placeholder: placeholder, value: value, onChange: (e) => onChange?.(e.target.value), onBlur: onBlur, style: inputStyle, className: "text-input" }));
}
