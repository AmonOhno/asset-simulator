import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
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
    wrapper: {
        display: "flex",
        flexDirection: "column",
        gap: 4,
        width: "100%",
    },
    inputRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
    },
    input: {
        fontSize: 16,
        padding: "0 12px",
        borderRadius: 8,
        border: "1px solid #D1D5DB",
        boxSizing: "border-box",
        textAlign: "right",
        flex: 1,
        color: "#333",
        backgroundColor: "#FFFFFF",
        width: "100%",
        minWidth: 0,
    },
    inputError: {
        borderColor: "#DC2626",
    },
    unit: {
        fontSize: 14,
        color: "#666",
        whiteSpace: "nowrap",
    },
    errorText: {
        fontSize: 12,
        color: "#DC2626",
        margin: 0,
    },
};
export function NumericInput({ value, unit, min, max, error, onBlur, sizeVariant = "Full", fontSize = "M", }) {
    const [localValue, setLocalValue] = useState(String(value));
    const handleBlur = () => {
        let parsed = parseFloat(localValue);
        if (isNaN(parsed)) {
            parsed = value;
        }
        if (min != null && parsed < min)
            parsed = min;
        if (max != null && parsed > max)
            parsed = max;
        setLocalValue(String(parsed));
        onBlur?.(parsed);
    };
    const wrapperStyle = {
        ...styles.wrapper,
        width: sizeWidthMap[sizeVariant],
    };
    return (_jsxs("div", { style: wrapperStyle, children: [_jsxs("div", { style: styles.inputRow, children: [_jsx("input", { type: "text", inputMode: "decimal", value: localValue, onChange: (e) => setLocalValue(e.target.value), onBlur: handleBlur, style: {
                            ...styles.input,
                            height: sizeHeightMap[sizeVariant],
                            fontSize: fontSizeMap[fontSize],
                            ...(error ? styles.inputError : {}),
                        } }), unit && _jsx("span", { style: styles.unit, children: unit })] }), error && _jsx("p", { style: styles.errorText, children: error })] }));
}
