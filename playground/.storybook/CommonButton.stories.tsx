import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { CommonButton } from "../src/components/CommonButton";

const meta = {
  title: "Components/CommonButton",
  component: CommonButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    sizeVariant: {
      control: "select",
      options: ["S", "M", "L", "Full"],
    },
    colorVariant: {
      control: "select",
      options: ["primary", "secondary"],
    },
  },
  args: { onClick: fn() },
} satisfies Meta<typeof CommonButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: "保存する",
    sizeVariant: "M",
    colorVariant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    label: "キャンセル",
    sizeVariant: "M",
    colorVariant: "secondary",
  },
};

export const Small: Story = {
  args: {
    label: "追加",
    sizeVariant: "S",
    colorVariant: "primary",
  },
};

export const Large: Story = {
  args: {
    label: "シミュレーション実行",
    sizeVariant: "L",
    colorVariant: "primary",
  },
};

export const FullWidth: Story = {
  args: {
    label: "ログイン",
    sizeVariant: "Full",
    colorVariant: "primary",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithIcon: Story = {
  args: {
    label: "追加",
    sizeVariant: "M",
    colorVariant: "primary",
    icon: "＋",
  },
};
