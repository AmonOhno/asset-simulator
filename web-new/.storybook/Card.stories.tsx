import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Card, CardBodyHead, CardBodyMain } from "../src/components/Card";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    isExpanded: { control: "boolean" },
    title: { control: "text" },
    subInfo: { control: "text" },
    maxHeight: { control: "text" },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isExpanded: true,
    title: "資産シミュレーション",
    subInfo: "概要",
    onToggle: () => {},
  },
  render: function Render(args) {
    const [isExpanded, setIsExpanded] = useState(args.isExpanded);
    return (
      <Card {...args} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)}>
        <CardBodyHead>
          <p style={{ margin: 0, color: "#666" }}>合計: ¥1,000,000</p>
        </CardBodyHead>
        <CardBodyMain>
          <p style={{ margin: 0 }}>ここにフォームなどのコンテンツが入ります。</p>
        </CardBodyMain>
      </Card>
    );
  },
};

export const Collapsed: Story = {
  args: {
    isExpanded: false,
    title: "投資設定",
    subInfo: "3件",
    onToggle: () => {},
  },
};

export const WithMaxHeight: Story = {
  args: {
    isExpanded: true,
    title: "スクロール表示",
    subInfo: "",
    maxHeight: 200,
    onToggle: () => {},
  },
  render: function Render(args) {
    const [isExpanded, setIsExpanded] = useState(true);
    return (
      <Card {...args} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)}>
        <CardBodyMain>
          {Array.from({ length: 10 }, (_, i) => (
            <p key={i} style={{ margin: "8px 0" }}>
              コンテンツ行 {i + 1}
            </p>
          ))}
        </CardBodyMain>
      </Card>
    );
  },
};
