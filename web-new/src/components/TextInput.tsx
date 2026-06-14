import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";
type FontSizeVariant = "S" | "M" | "L";

interface TextInputProps {
  placeholder: string;
  sizeVariant?: SizeVariant;
  fontSize?: FontSizeVariant;
  value: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
}

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

const styles = {
  input: {
    fontSize: 16,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    boxSizing: "border-box",
    color: "#333",
    backgroundColor: "#FFFFFF",
  } satisfies CSSProperties,
  placeholder: {
    color: "#888",
  } satisfies CSSProperties,
};

export function TextInput({
  placeholder,
  sizeVariant = "Full",
  fontSize = "M",
  value,
  onBlur,
  onChange,
}: TextInputProps) {
  const inputStyle: CSSProperties = {
    ...styles.input,
    width: sizeWidthMap[sizeVariant],
    height: sizeHeightMap[sizeVariant],
    fontSize: fontSizeMap[fontSize],
  };

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      style={inputStyle}
      className="text-input"
    />
  );
}
