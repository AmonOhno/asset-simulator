import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";
type FontSizeVariant = "S" | "M" | "L";

const sizeWidthMap: Record<SizeVariant, string> = {
  S: "130px",
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

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  sizeVariant?: SizeVariant;
  fontSize?: FontSizeVariant;
}

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
  } satisfies CSSProperties,
};

export function DateInput({ value, onChange, onBlur, sizeVariant = "Full", fontSize = "M" }: DateInputProps) {
  const inputStyle: CSSProperties = {
    ...styles.input,
    width: sizeWidthMap[sizeVariant],
    height: sizeHeightMap[sizeVariant],
    fontSize: fontSizeMap[fontSize],
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
