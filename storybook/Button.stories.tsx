import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../landing-page/components/ui/Button";

const meta: Meta<typeof Button> = {
  title: "// COMMANDS / Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'The "Command Unit" — violet glow primary, ghost for secondary, mono for tertiary text-only actions. Max 6px radius. Replaces drop shadows with `shadow-glow`.',
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "ghost", "mono"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "⬇ Download",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Sign in",
  },
};

export const Mono: Story = {
  args: {
    variant: "mono",
    children: "_VIEW_LOGS",
  },
};

export const WithIcon: Story = {
  args: {
    variant: "primary",
    children: "App Store",
    icon: <span aria-hidden>⬇</span>,
  },
};

export const Korean: Story = {
  args: {
    variant: "primary",
    children: "시작하기",
  },
};

// Visual QA — all variants on one canvas
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="mono">_MONO_ACTION</Button>
      </div>
      <div className="flex gap-4">
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="ghost" disabled>
          Disabled
        </Button>
      </div>
      <div className="flex gap-4">
        <Button variant="primary" className="h-14 px-8">
          ⬇ App Store
        </Button>
        <Button variant="primary" className="h-14 px-8">
          ⬇ Google Play
        </Button>
      </div>
    </div>
  ),
};
