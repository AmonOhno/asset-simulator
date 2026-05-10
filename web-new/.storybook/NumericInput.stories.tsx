import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { NumericInput } from "../src/components/NumericInput";

const meta = {
  title: "Components/NumericInput",
  component: NumericInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    unit: { control: "text" },
    min: { control: "number" },
    max: { control: "number" },
    error: { control: "text" },
    sizeVariant: {
      control: "select",
      options: ["S", "M", "L", "Full"],
    },
  },
} satisfies Meta<typeof NumericInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 1000000,
    unit: "円",
    sizeVariant: "Full",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  },
};

export const WithPercentage: Story = {
  args: {
    value: 3.5,
    unit: "%",
    min: 0,
    max: 100,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  },
};

export const WithYears: Story = {
  args: {
    value: 10,
    unit: "年",
    min: 1,
    max: 50,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  },
};

export const SizeSmall: Story = {
  args: {
    value: 10,
    unit: "年",
    min: 1,
    max: 50,
    sizeVariant: "S",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  },
};

export const SizeMedium: Story = {
  args: {
    value: 3.5,
    unit: "%",
    min: 0,
    max: 100,
    sizeVariant: "M",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  },
};

export const WithError: Story = {
  args: {
    value: -100,
    unit: "円",
    min: 0,
    error: "0以上の値を入力してください",
  },
};

export const WithMinMax: Story = {
  args: {
    value: 50,
    unit: "%",
    min: 0,
    max: 100,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <NumericInput {...args} value={value} onBlur={setValue} />;
  },
};
