import { type CSSProperties, type ReactNode } from "react";

interface CardProps {
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
  subInfo?: string;
  maxHeight?: string | number;
  children?: ReactNode;
}

interface CardBodyProps {
  children?: ReactNode;
}

const styles = {
  container: {
    width: 358,
    borderRadius: 12,
    background: "#FFFFFF",
    boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
    overflow: "hidden",
  } satisfies CSSProperties,
  header: {
    height: 32,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 12px",
    cursor: "pointer",
    userSelect: "none",
  } satisfies CSSProperties,
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
    margin: 0,
  } satisfies CSSProperties,
  headerSubInfo: {
    fontSize: 13,
    color: "#888",
    margin: 0,
  } satisfies CSSProperties,
  chevron: {
    fontSize: 12,
    color: "#888",
    marginLeft: 8,
    transition: "transform 0.2s ease",
  } satisfies CSSProperties,
  body: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  } satisfies CSSProperties,
};

export function CardBodyHead({ children }: CardBodyProps) {
  return <div>{children}</div>;
}

export function CardBodyMain({ children }: CardBodyProps) {
  return <div>{children}</div>;
}

export function Card({
  isExpanded,
  onToggle,
  title,
  subInfo,
  maxHeight,
  children,
}: CardProps) {
  const containerStyle: CSSProperties = {
    ...styles.container,
    ...(maxHeight != null ? { maxHeight } : {}),
  };

  const bodyStyle: CSSProperties = {
    ...styles.body,
    ...(maxHeight != null ? { overflowY: "auto", flex: 1 } : {}),
  };

  return (
    <div style={containerStyle}>
      <div
        style={styles.header}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={isExpanded}
      >
        <span style={styles.headerTitle}>{title}</span>
        <span>
          {subInfo && <span style={styles.headerSubInfo}>{subInfo}</span>}
          <span
            style={{
              ...styles.chevron,
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▼
          </span>
        </span>
      </div>
      {isExpanded && <div style={bodyStyle}>{children}</div>}
    </div>
  );
}
