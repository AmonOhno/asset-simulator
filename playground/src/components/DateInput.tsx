import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";

const sizeWidthMap: Record<SizeVariant, string> = {
  S: "140px",
  M: "160px",
  L: "240px",
  Full: "100%",
};

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  sizeVariant?: SizeVariant;
}

const DATE_MIN = "2000-01-01";
const DATE_MAX = "2100-12-31";

const styles = {
  input: {
    height: 44,
    fontSize: 16,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    boxSizing: "border-box",
    width: "100%",
    color: "#333",
    backgroundColor: "#FFFFFF",
  } satisfies CSSProperties,
};

export function DateInput({ value, onChange, onBlur, sizeVariant = "Full" }: DateInputProps) {
  const inputStyle: CSSProperties = {
    ...styles.input,
    width: sizeWidthMap[sizeVariant],
  };

  return (
    <input
      type="date"
      value={value}
      min={DATE_MIN}
      max={DATE_MAX}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      style={inputStyle}
    />
  );
}
