import { type CSSProperties, type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 1000,
  } satisfies CSSProperties,
  panel: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "90dvh",
    overflowY: "auto",
    borderRadius: 16,
    background: "#FFFFFF",
    boxShadow: "0 20px 48px rgba(15, 23, 42, 0.24)",
    boxSizing: "border-box",
  } satisfies CSSProperties,
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #E5E7EB",
  } satisfies CSSProperties,
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  } satisfies CSSProperties,
  close: {
    border: "none",
    background: "transparent",
    fontSize: 22,
    lineHeight: 1,
    color: "#6B7280",
    cursor: "pointer",
    padding: 4,
  } satisfies CSSProperties,
  body: {
    padding: 20,
  } satisfies CSSProperties,
};

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      style={styles.overlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && (
          <div style={styles.header}>
            <h2 style={styles.title}>{title}</h2>
            <button
              type="button"
              style={styles.close}
              onClick={onClose}
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        )}
        <div style={styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
