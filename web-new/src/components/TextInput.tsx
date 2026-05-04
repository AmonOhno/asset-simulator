import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";

interface TextInputProps {
  placeholder: string;
  sizeVariant?: SizeVariant;
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

const styles = {
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
  placeholder: {
    color: "#888",
  } satisfies CSSProperties,
};

export function TextInput({
  placeholder,
  sizeVariant = "Full",
  value,
  onBlur,
  onChange,
}: TextInputProps) {
  const inputStyle: CSSProperties = {
    ...styles.input,
    width: sizeWidthMap[sizeVariant],
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
