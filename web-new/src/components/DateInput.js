import { jsx as _jsx } from "react/jsx-runtime";
const sizeWidthMap = {
    S: "130px",
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
const DATE_MIN = "2000-01-01";
const DATE_MAX = "2100-12-31";
const styles = {
    input: {
        padding: "0 12px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        boxSizing: "border-box",
        width: "100%",
        color: "#333",
        backgroundColor: "#FFFFFF",
    },
};
export function DateInput({ value, onChange, onBlur, sizeVariant = "Full", fontSize = "M" }) {
    const inputStyle = {
        ...styles.input,
        width: sizeWidthMap[sizeVariant],
        height: sizeHeightMap[sizeVariant],
        fontSize: fontSizeMap[fontSize],
    };
    return (_jsx("input", { type: "date", value: value, min: DATE_MIN, max: DATE_MAX, onChange: (e) => onChange(e.target.value), onBlur: onBlur, style: inputStyle }));
}
