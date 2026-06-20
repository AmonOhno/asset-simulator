import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SelectInput } from "../src/components/SelectInput";

const planOptions = [
  { label: "積立投資", value: "tsumitate" },
  { label: "一括投資", value: "lump_sum" },
  { label: "分散投資", value: "diversified" },
];

const meta = {
  title: "Components/SelectInput",
  component: SelectInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    sizeVariant: {
      control: "select",
      options: ["S", "M", "L", "Full"],
    },
  },
} satisfies Meta<typeof SelectInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    options: planOptions,
    value: "tsumitate",
    onChange: () => {},
    sizeVariant: "Full",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div style={{ width: 280 }}>
        <SelectInput {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const SizeSmall: Story = {
  args: {
    options: planOptions,
    value: "tsumitate",
    onChange: () => {},
    sizeVariant: "S",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SelectInput {...args} value={value} onChange={setValue} />;
  },
};

export const SizeMedium: Story = {
  args: {
    options: planOptions,
    value: "lump_sum",
    onChange: () => {},
    sizeVariant: "M",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SelectInput {...args} value={value} onChange={setValue} />;
  },
};

export const SizeLarge: Story = {
  args: {
    options: planOptions,
    value: "diversified",
    onChange: () => {},
    sizeVariant: "L",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <SelectInput {...args} value={value} onChange={setValue} />;
  },
};

export const NumericValues: Story = {
  args: {
    options: [
      { label: "毎月", value: 1 },
      { label: "毎週", value: 2 },
      { label: "毎日", value: 3 },
    ],
    value: 1,
    onChange: () => {},
  },
  render: function Render(args) {
    const [value, setValue] = useState(String(args.value));
    return (
      <div style={{ width: 280 }}>
        <SelectInput {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};
