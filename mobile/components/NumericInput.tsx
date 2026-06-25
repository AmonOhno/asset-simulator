import { useState, type CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";
type FontSizeVariant = "S" | "M" | "L";

const sizeWidthMap: Record<SizeVariant, string> = {
  S: "120px",
  M: "160px",
  L: "240px",
  Full: "100%",
};

const sizeHeightMap: Record<SizeVariant, string> = {
  S: "32px",
  M: "44px",
  L: "56px",
  Full: "44px",
};

const fontSizeMap: Record<FontSizeVariant, number> = {
  S: 14,
  M: 16,
  L: 18,
};

interface NumericInputProps {
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  error?: string;
  /** 表示用プレースホルダー。指定すると value が 0 のとき入力欄を空にして背面テキストを表示する */
  placeholder?: string;
  /** マイナス値の入力を許可する（モバイル向けに符号反転ボタンを表示） */
  allowNegative?: boolean;
  onBlur?: (value: number) => void;
  sizeVariant?: SizeVariant;
  fontSize?: FontSizeVariant;
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
  } satisfies CSSProperties,
  inputError: {
    borderColor: "#DC2626",
  } satisfies CSSProperties,
  unit: {
    fontSize: 14,
    color: "#666",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  signButton: {
    flexShrink: 0,
    width: 36,
    alignSelf: "stretch",
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    backgroundColor: "#F9FAFB",
    color: "#374151",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
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
  placeholder,
  allowNegative = false,
  onBlur,
  sizeVariant = "Full",
  fontSize = "M",
}: NumericInputProps) {
  // placeholder 指定時は 0 を空欄として表示し、背面テキストを見せる
  const display = (n: number) => (placeholder != null && n === 0 ? "" : String(n));
  const [localValue, setLocalValue] = useState(() => display(value));

  const commit = (raw: string) => {
    let parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      parsed = placeholder != null ? 0 : value;
    }
    if (min != null && parsed < min) parsed = min;
    if (max != null && parsed > max) parsed = max;
    setLocalValue(display(parsed));
    onBlur?.(parsed);
  };

  const handleBlur = () => commit(localValue);

  const toggleSign = () => {
    const parsed = parseFloat(localValue);
    if (isNaN(parsed) || parsed === 0) return;
    commit(String(-parsed));
  };

  const wrapperStyle: CSSProperties = {
    ...styles.wrapper,
    width: sizeWidthMap[sizeVariant],
  };

  return (
    <div style={wrapperStyle}>
      <div style={styles.inputRow}>
        {allowNegative && (
          <button
            type="button"
            aria-label="符号を反転"
            onClick={toggleSign}
            style={{ ...styles.signButton, height: sizeHeightMap[sizeVariant] }}
          >
            ±
          </button>
        )}
        <input
          type="text"
          inputMode={allowNegative ? "text" : "decimal"}
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          style={{
            ...styles.input,
            height: sizeHeightMap[sizeVariant],
            fontSize: fontSizeMap[fontSize],
            ...(error ? styles.inputError : {}),
          }}
        />
        {unit && <span style={styles.unit}>{unit}</span>}
      </div>
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}
