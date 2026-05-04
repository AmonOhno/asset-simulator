import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TextInput } from "../src/components/TextInput";

const meta = {
  title: "Components/TextInput",
  component: TextInput,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    sizeVariant: {
      control: "select",
      options: ["S", "M", "L", "Full"],
    },
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text here",
    value: "",
    sizeVariant: "Full",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div style={{ width: 320 }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const Small: Story = {
  args: {
    placeholder: "Small input",
    value: "",
    sizeVariant: "S",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div style={{ width: 320 }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const Medium: Story = {
  args: {
    placeholder: "Medium input",
    value: "",
    sizeVariant: "M",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div style={{ width: 320 }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};

export const Large: Story = {
  args: {
    placeholder: "Large input",
    value: "",
    sizeVariant: "L",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div style={{ width: 320 }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};
