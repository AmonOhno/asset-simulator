import { useState, type CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";

const sizeWidthMap: Record<SizeVariant, string> = {
  S: "100px",
  M: "160px",
  L: "240px",
  Full: "100%",
};

interface NumericInputProps {
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  error?: string;
  onBlur?: (value: number) => void;
  sizeVariant?: SizeVariant;
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    width: "100%",
  } satisfies CSSProperties,
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  } satisfies CSSProperties,
  input: {
    height: 44,
    fontSize: 16,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    boxSizing: "border-box",
    textAlign: "right",
    flex: 1,
    color: "#333",
    backgroundColor: "#FFFFFF",
  } satisfies CSSProperties,
  inputError: {
    borderColor: "#DC2626",
  } satisfies CSSProperties,
  unit: {
    fontSize: 14,
    color: "#666",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    margin: 0,
  } satisfies CSSProperties,
};

export function NumericInput({
  value,
  unit,
  min,
  max,
  error,
  onBlur,
  sizeVariant = "Full",
}: NumericInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  const handleBlur = () => {
    let parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      parsed = value;
    }
    if (min != null && parsed < min) parsed = min;
    if (max != null && parsed > max) parsed = max;
    setLocalValue(String(parsed));
    onBlur?.(parsed);
  };

  const wrapperStyle: CSSProperties = {
    ...styles.wrapper,
    width: sizeWidthMap[sizeVariant],
  };

  return (
    <div style={wrapperStyle}>
      <div style={styles.inputRow}>
        <input
          type="text"
          inputMode="decimal"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          style={{
            ...styles.input,
            ...(error ? styles.inputError : {}),
          }}
        />
        {unit && <span style={styles.unit}>{unit}</span>}
      </div>
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}
