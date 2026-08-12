import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorBoundary } from "../components/ErrorBoundary";

// 描画時に必ず throw して、フォールバック画面をカタログ表示するための子コンポーネント
function Exploding(): never {
  throw new Error("Cannot read properties of undefined (reading 'reduce')");
}

const meta = {
  title: "Components/ErrorBoundary",
  component: ErrorBoundary,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Exploding />,
  },
};

export const WithCustomFallback: Story = {
  args: {
    children: <Exploding />,
    fallback: <div style={{ padding: 24 }}>支出目標の表示に失敗しました。</div>,
  },
};

export const NoError: Story = {
  args: {
    children: <div style={{ padding: 24 }}>正常に描画された子要素</div>,
  },
};
