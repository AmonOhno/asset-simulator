import type { CSSProperties } from "react";

type SizeVariant = "S" | "M" | "L" | "Full";
type FontSizeVariant = "S" | "M" | "L";

/** リストの最大高さ。超える分はスクロールする */
const sizeMaxHeightMap: Record<SizeVariant, string> = {
  S: "120px",
  M: "180px",
  L: "240px",
  Full: "none",
};

const fontSizeMap: Record<FontSizeVariant, number> = {
  S: 14,
  M: 16,
  L: 18,
};

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectInputProps {
  options: MultiSelectOption[];
  /** 選択中の値。順序は options の並びに揃えて onChange で返す */
  values: string[];
  onChange: (values: string[]) => void;
  sizeVariant?: SizeVariant;
  fontSize?: FontSizeVariant;
  /** 選択肢が 0 件のときに表示する文言 */
  emptyMessage?: string;
}

const styles = {
  list: {
    display: "grid",
    gap: 2,
    padding: 4,
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    backgroundColor: "#FFFFFF",
    boxSizing: "border-box",
    width: "100%",
    overflowY: "auto",
    textAlign: "left",
  } satisfies CSSProperties,
  option: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 8px",
    borderRadius: 6,
    color: "#333",
    cursor: "pointer",
  } satisfies CSSProperties,
  checkbox: {
    width: 18,
    height: 18,
    flexShrink: 0,
    accentColor: "#4F46E5",
  } satisfies CSSProperties,
  empty: {
    padding: "8px",
    color: "#6B7280",
  } satisfies CSSProperties,
};

/**
 * チェックボックスによる複数選択入力。
 * select multiple はモバイルでの操作性が悪いため、タップしやすいリスト形式にしている。
 */
export function MultiSelectInput({
  options,
  values,
  onChange,
  sizeVariant = "Full",
  fontSize = "M",
  emptyMessage = "選択できる項目がありません",
}: MultiSelectInputProps) {
  const selected = new Set(values);

  const toggle = (value: string) => {
    const next = selected.has(value)
      ? values.filter((v) => v !== value)
      : // options の並び順を保って返す
        options.filter((opt) => opt.value === value || selected.has(opt.value)).map((opt) => opt.value);
    onChange(next);
  };

  const listStyle: CSSProperties = {
    ...styles.list,
    maxHeight: sizeMaxHeightMap[sizeVariant],
    fontSize: fontSizeMap[fontSize],
  };

  return (
    <div style={listStyle} role="group">
      {options.length === 0 && <div style={styles.empty}>{emptyMessage}</div>}
      {options.map((opt) => {
        const isSelected = selected.has(opt.value);
        return (
          <label
            key={opt.value}
            style={{ ...styles.option, backgroundColor: isSelected ? "#EEF2FF" : "transparent" }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggle(opt.value)}
              style={styles.checkbox}
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
