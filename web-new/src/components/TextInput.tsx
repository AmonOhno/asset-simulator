import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";
type LabelVariant = "top" | "left";

interface TextInputProps {
  label: string;
  sizeVariant?: SizeVariant;
  labelVariant?: LabelVariant;
  value: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
}

const sizeWidthMap: Record<SizeVariant, string> = {
  S: "100px",
  M: "160px",
  L: "240px",
  Full: "100%",
};

const styles = {
  wrapperTop: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  } satisfies CSSProperties,
  wrapperLeft: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  } satisfies CSSProperties,
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
    whiteSpace: "nowrap",
  } satisfies CSSProperties,
  input: {
    height: 44,
    fontSize: 16,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    boxSizing: "border-box",
    color: "#333",
    backgroundColor: "#FFFFFF",
  } satisfies CSSProperties,
};

export function TextInput({
  label,
  sizeVariant = "Full",
  labelVariant = "top",
  value,
  onBlur,
  onChange,
}: TextInputProps) {
  const wrapperStyle =
    labelVariant === "top" ? styles.wrapperTop : styles.wrapperLeft;

  const inputStyle: CSSProperties = {
    ...styles.input,
    width: sizeWidthMap[sizeVariant],
  };

  return (
    <div style={wrapperStyle}>
      <label style={styles.label}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        style={inputStyle}
      />
    </div>
  );
}
