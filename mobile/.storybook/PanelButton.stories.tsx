import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { PanelButton } from "../src/components/PanelButton";

const meta = {
  title: "Components/PanelButton",
  component: PanelButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onClick: fn() },
} satisfies Meta<typeof PanelButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AccountBalance: Story = {
  args: {
    title: "普通預金残高",
    value: "¥1,250,000",
    onClick: fn(),
  },
};

export const TotalExpenses: Story = {
  args: {
    title: "今月の支出",
    value: "¥180,500",
    onClick: fn(),
  },
};

export const NetIncome: Story = {
  args: {
    title: "手取り収入",
    value: "¥350,000",
    onClick: fn(),
  },
};

export const InvestmentValue: Story = {
  args: {
    title: "投資資産",
    value: 2500000,
    onClick: fn(),
  },
};

export const LargeNumber: Story = {
  args: {
    title: "総資産",
    value: "¥5,000,000",
    onClick: fn(),
  },
};

export const WithSubText: Story = {
  args: {
    title: "当期純利益",
    value: "¥850,000",
    subText: "基準日: 2026-05-31",
    onClick: fn(),
  },
};

export const WithCalculationPeriod: Story = {
  args: {
    title: "月間売上",
    value: "¥2,500,000",
    subText: "計算期間: 2026-05-01 ～ 2026-05-31",
    onClick: fn(),
  },
};
