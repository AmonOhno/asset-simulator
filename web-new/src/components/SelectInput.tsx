import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";

const sizeWidthMap: Record<SizeVariant, string> = {
  S: "100px",
  M: "160px",
  L: "240px",
  Full: "100%",
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
}

const styles = {
  wrapper: {
    position: "relative",
    width: "100%",
  } satisfies CSSProperties,
  select: {
    height: 44,
    fontSize: 16,
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

export function SelectInput({ options, value, onChange, sizeVariant = "Full" }: SelectInputProps) {
  const wrapperStyle: CSSProperties = {
    ...styles.wrapper,
    width: sizeWidthMap[sizeVariant],
  };

  return (
    <div style={wrapperStyle}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.select}
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
