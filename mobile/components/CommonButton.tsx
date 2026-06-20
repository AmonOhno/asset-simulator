import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "LL" | "Full";
type ColorVariant = "primary" | "secondary";

interface CommonButtonProps {
  label: string;
  sizeVariant?: SizeVariant;
  colorVariant?: ColorVariant;
  /** font size variant: S | M | L */
  fontSize?: "S" | "M" | "L";
  icon?: string;
  onClick?: () => void;
}

const sizeWidthMap: Record<SizeVariant, string> = {
  S: "60px",
  M: "120px",
  L: "160px",
  LL: "200px",
  Full: "100%",
};

const sizeHeightMap: Record<SizeVariant, string> = {
  S: "32px",
  M: "48px",
  L: "64px",
  LL: "48px",
  Full: "48px",
};

const fontSizeMap: Record<"S" | "M" | "L", number> = {
  S: 14,
  M: 16,
  L: 18,
};

const colorStyles: Record<ColorVariant, CSSProperties> = {
  primary: {
    backgroundColor: "#4F46E5",
    color: "#FFFFFF",
    border: "none",
  },
  secondary: {
    backgroundColor: "#FFFFFF",
    color: "#4F46E5",
    border: "1.5px solid #4F46E5",
  },
};

const baseStyle: CSSProperties = {
  fontWeight: 700,
  borderRadius: 8,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  boxSizing: "border-box",
  transition: "opacity 0.15s ease",
};

export function CommonButton({
  label,
  sizeVariant = "M",
  colorVariant = "primary",
  fontSize = "M",
  icon,
  onClick,
}: CommonButtonProps) {
  const style: CSSProperties = {
    ...baseStyle,
    ...colorStyles[colorVariant],
    width: sizeWidthMap[sizeVariant],
    height: sizeHeightMap[sizeVariant],
    fontSize: fontSizeMap[fontSize],
  };

  return (
    <button type="button" style={style} onClick={onClick}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </button>
  );
}
