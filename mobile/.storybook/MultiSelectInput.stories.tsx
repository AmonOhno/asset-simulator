import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { MultiSelectInput } from "../components/MultiSelectInput";

const expenseOptions = [
  { label: "食費", value: "jacc_food" },
  { label: "外食費", value: "jacc_eatout" },
  { label: "日用品費", value: "jacc_daily" },
  { label: "交通費", value: "jacc_transport" },
  { label: "娯楽費", value: "jacc_leisure" },
  { label: "水道光熱費", value: "jacc_utility" },
];

const meta = {
  title: "Components/MultiSelectInput",
  component: MultiSelectInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    sizeVariant: {
      control: "select",
      options: ["S", "M", "L", "Full"],
    },
  },
} satisfies Meta<typeof MultiSelectInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: expenseOptions,
    values: ["jacc_food", "jacc_eatout"],
    onChange: () => {},
    sizeVariant: "M",
  },
  render: function Render(args) {
    const [values, setValues] = useState(args.values);
    return (
      <div style={{ width: 280 }}>
        <MultiSelectInput {...args} values={values} onChange={setValues} />
      </div>
    );
  },
};

export const NoSelection: Story = {
  args: {
    options: expenseOptions,
    values: [],
    onChange: () => {},
    sizeVariant: "S",
  },
  render: function Render(args) {
    const [values, setValues] = useState(args.values);
    return (
      <div style={{ width: 280 }}>
        <MultiSelectInput {...args} values={values} onChange={setValues} />
      </div>
    );
  },
};

export const Empty: Story = {
  args: {
    options: [],
    values: [],
    onChange: () => {},
    emptyMessage: "費用科目が登録されていません",
  },
  render: function Render(args) {
    return (
      <div style={{ width: 280 }}>
        <MultiSelectInput {...args} />
      </div>
    );
  },
};
