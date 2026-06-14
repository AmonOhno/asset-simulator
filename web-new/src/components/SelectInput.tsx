import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";
type FontSizeVariant = "S" | "M" | "L";

const sizeWidthMap: Record<SizeVariant, string> = {
  S: "140px",
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

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectInputProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string) => void;
  sizeVariant?: SizeVariant;
  fontSize?: FontSizeVariant;
}

const styles = {
  wrapper: {
    position: "relative",
    width: "100%",
  } satisfies CSSProperties,
  select: {
    padding: "0 36px 0 12px",
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    boxSizing: "border-box",
    width: "100%",
    color: "#333",
    backgroundColor: "#FFFFFF",
    appearance: "none",
    cursor: "pointer",
  } satisfies CSSProperties,
  icon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    width: 16,
    height: 16,
  } satisfies CSSProperties,
};

function ChevronDownIcon() {
  return (
    <svg
      style={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#666"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function SelectInput({ options, value, onChange, sizeVariant = "Full", fontSize = "M" }: SelectInputProps) {
  const wrapperStyle: CSSProperties = {
    ...styles.wrapper,
    width: sizeWidthMap[sizeVariant],
  };

  const selectStyle: CSSProperties = {
    ...styles.select,
    height: sizeHeightMap[sizeVariant],
    fontSize: fontSizeMap[fontSize],
  };

  return (
    <div style={wrapperStyle}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={selectStyle}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon />
    </div>
  );
}
