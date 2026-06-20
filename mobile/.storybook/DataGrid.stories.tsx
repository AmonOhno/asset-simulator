import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataGrid } from "../src/components/DataGrid";

interface SampleRow {
  year: string;
  principal: string;
  interest: string;
  total: string;
}

const sampleData: SampleRow[] = [
  { year: "2025", principal: "1,000,000", interest: "30,000", total: "1,030,000" },
  { year: "2026", principal: "1,030,000", interest: "30,900", total: "1,060,900" },
  { year: "2027", principal: "1,060,900", interest: "31,827", total: "1,092,727" },
  { year: "2028", principal: "1,092,727", interest: "32,782", total: "1,125,509" },
  { year: "2029", principal: "1,125,509", interest: "33,765", total: "1,159,274" },
];

const columns = [
  { label: "年度", key: "year" as const, width: 60, align: "center" as const },
  { label: "元本", key: "principal" as const, width: 120, align: "right" as const },
  { label: "利息", key: "interest" as const, width: 100, align: "right" as const },
  { label: "合計", key: "total" as const, width: 120, align: "right" as const },
];

function SampleDataGrid(props: {
  data: SampleRow[];
  columns: typeof columns;
  colorVariant?: "blue" | "red" | "gray";
}) {
  return <DataGrid<SampleRow> {...props} />;
}

const meta = {
  title: "Components/DataGrid",
  component: SampleDataGrid,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    colorVariant: {
      control: "select",
      options: ["blue", "red", "gray"],
    },
  },
} satisfies Meta<typeof SampleDataGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blue: Story = {
  args: {
    data: sampleData,
    columns,
    colorVariant: "blue",
  },
};

export const Red: Story = {
  args: {
    data: sampleData,
    columns,
    colorVariant: "red",
  },
};

export const Gray: Story = {
  args: {
    data: sampleData,
    columns,
    colorVariant: "gray",
  },
};
