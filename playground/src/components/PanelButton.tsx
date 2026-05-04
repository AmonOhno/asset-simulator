import { type CSSProperties } from "react";

interface PanelButtonProps {
  title: string;
  value: string | number;
  onClick: () => void;
}

const styles = {
  container: {
    width: 358,
    borderRadius: 20,
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    padding: "24px 20px",
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
    transition: "all 0.2s ease",
  } satisfies CSSProperties,
  title: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 10,
  } satisfies CSSProperties,
  value: {
    fontSize: 36,
    fontWeight: 800,
    color: "#0F172A",
  } satisfies CSSProperties,
  action: {
    marginTop: 8,
    color: "#3B82F6",
    fontWeight: 700,
  } satisfies CSSProperties,
};

export function PanelButton({ title, value, onClick }: PanelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={styles.container}
    >
      <div style={styles.title}>{title}</div>
      <div style={styles.value}>{value}</div>
    </button>
  );
}