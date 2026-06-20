import type { CSSProperties } from "react";

type ColorVariant = "blue" | "red" | "gray";

interface ColumnConfig<T> {
  label: string;
  key: keyof T & string;
  width?: string | number;
  align?: "left" | "center" | "right";
}

interface DataGridProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  colorVariant?: ColorVariant;
}

const headerColorMap: Record<ColorVariant, CSSProperties> = {
  blue: { backgroundColor: "#EEF2FF", color: "#4F46E5" },
  red: { backgroundColor: "#FEF2F2", color: "#DC2626" },
  gray: { backgroundColor: "#F3F4F6", color: "#374151" },
};

const styles = {
  wrapper: {
    overflowX: "auto",
    width: "100%",
    boxSizing: "border-box",
  } satisfies CSSProperties,
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  } satisfies CSSProperties,
  th: {
    height: 40,
    padding: "0 8px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    textAlign: "left",
    borderBottom: "1px solid #E5E7EB",
  } satisfies CSSProperties,
  td: {
    height: 40,
    padding: "0 8px",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #F3F4F6",
  } satisfies CSSProperties,
};

export function DataGrid<T extends object>({
  data,
  columns,
  colorVariant = "gray",
}: DataGridProps<T>) {
  const headerColor = headerColorMap[colorVariant];

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  ...styles.th,
                  ...headerColor,
                  textAlign: col.align ?? "left",
                  ...(col.width != null ? { width: col.width } : {}),
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    ...styles.td,
                    textAlign: col.align ?? "left",
                  }}
                >
                  {String(row[col.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
