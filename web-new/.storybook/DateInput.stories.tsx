import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { DateInput } from "../src/components/DateInput";

const meta = {
  title: "Components/DateInput",
  component: DateInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    sizeVariant: {
      control: "select",
      options: ["S", "M", "L", "Full"],
    },
  },
} satisfies Meta<typeof DateInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: "2025-04-01",
    onChange: () => {},
    sizeVariant: "Full",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

export const SizeSmall: Story = {
  args: {
    value: "2025-04-01",
    onChange: () => {},
    sizeVariant: "S",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

export const SizeMedium: Story = {
  args: {
    value: "2025-04-01",
    onChange: () => {},
    sizeVariant: "M",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

export const SizeLarge: Story = {
  args: {
    value: "2025-04-01",
    onChange: () => {},
    sizeVariant: "L",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};

export const Empty: Story = {
  args: {
    value: "",
    onChange: () => {},
    sizeVariant: "Full",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <DateInput {...args} value={value} onChange={setValue} />;
  },
};
