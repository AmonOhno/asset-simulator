import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { useState } from "react";
import { Dialog } from "../components/Dialog";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { onClose: fn() },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    title: "2026-06-20 の取引入力",
    children: <div>ダイアログの本文がここに表示されます。</div>,
  },
};

export const Toggle: Story = {
  args: {
    isOpen: false,
    title: "取引入力",
    children: <div>ダイアログの本文がここに表示されます。</div>,
  },
  render: function Render(args) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setIsOpen(true)}>
          ダイアログを開く
        </button>
        <Dialog {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  },
};
