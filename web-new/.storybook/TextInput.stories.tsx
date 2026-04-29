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
    labelVariant: {
      control: "select",
      options: ["top", "left"],
    },
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LabelTop: Story = {
  args: {
    label: "資産名",
    value: "",
    sizeVariant: "Full",
    labelVariant: "top",
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

export const LabelLeft: Story = {
  args: {
    label: "名前",
    value: "",
    sizeVariant: "L",
    labelVariant: "left",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <TextInput {...args} value={value} onChange={setValue} />;
  },
};

export const SizeSmall: Story = {
  args: {
    label: "コード",
    value: "A01",
    sizeVariant: "S",
    labelVariant: "top",
  },
};

export const SizeMedium: Story = {
  args: {
    label: "カテゴリ",
    value: "投資信託",
    sizeVariant: "M",
    labelVariant: "top",
  },
};

export const SizeFull: Story = {
  args: {
    label: "メモ",
    value: "運用メモをここに入力",
    sizeVariant: "Full",
    labelVariant: "top",
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div style={{ width: 358 }}>
        <TextInput {...args} value={value} onChange={setValue} />
      </div>
    );
  },
};
