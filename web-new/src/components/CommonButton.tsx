import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "LL" | "Full";
type ColorVariant = "primary" | "secondary";

interface CommonButtonProps {
  label: string;
  sizeVariant?: SizeVariant;
  colorVariant?: ColorVariant;
  icon?: string;
  onClick?: () => void;
}

const sizeWidthMap: Record<SizeVariant, string> = {
  S: "80px",
  M: "120px",
  L: "160px",
  LL: "200px",
  Full: "100%",
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
  height: 48,
  fontSize: 16,
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
  icon,
  onClick,
}: CommonButtonProps) {
  const style: CSSProperties = {
    ...baseStyle,
    ...colorStyles[colorVariant],
    width: sizeWidthMap[sizeVariant],
  };

  return (
    <button type="button" style={style} onClick={onClick}>
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </button>
  );
}
