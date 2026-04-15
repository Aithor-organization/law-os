import type { Meta, StoryObj } from "@storybook/react";
import { TerminalCard } from "../landing-page/components/ui/TerminalCard";

const meta: Meta<typeof TerminalCard> = {
  title: "// FOLIO / TerminalCard",
  component: TerminalCard,
  parameters: {
    layout: "centered",
    backgrounds: { default: "void" },
    docs: {
      description: {
        component:
          'The "Folio" card — surface #141418, 6px radius, hover violet glow. No dividers, only vertical rhythm. Use a mono tag header (e.g., "01 · KEYBOARD FIRST"), a Pretendard title, and an optional footer line.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TerminalCard>;

export const KeyboardFirst: Story = {
  args: {
    tag: "01 · KEYBOARD FIRST",
    title: "마우스를 버리세요",
    children:
      "30+ 단축키로 마우스 없이 전체 앱을 제어. 판례 검색, 새 채팅, 내보내기까지 0.5초.",
    footer: "// used 847,392 times this month",
  },
};

export const Intelligence: Story = {
  args: {
    tag: "02 · INTELLIGENCE",
    title: "당신보다 잘 아는 AI",
    children:
      "GPT-4 Turbo + Claude Opus 4.6에 민법/형법/헌법 전체 DB를 RAG로 연결. 인용은 필수.",
    footer: "// 98.4% citation accuracy",
  },
};

export const SecondBrain: Story = {
  args: {
    tag: "03 · YOUR SECOND BRAIN",
    title: "지식이 쌓입니다",
    children:
      "모든 질문이 자동으로 분류·색인됩니다. Obsidian처럼 링크되고 Anki로 내보내기.",
    footer: "// avg 2,847 notes after 3 months",
  },
};

// Visual QA — 3-column grid like the landing page features section
export const Grid: Story = {
  render: () => (
    <div className="mx-auto grid max-w-6xl gap-6 p-8 md:grid-cols-3">
      <TerminalCard
        tag="01 · KEYBOARD FIRST"
        title="마우스를 버리세요"
        footer="// 847k uses"
      >
        30+ 단축키로 전체 앱 제어
      </TerminalCard>
      <TerminalCard
        tag="02 · INTELLIGENCE"
        title="당신보다 잘 아는 AI"
        footer="// 98.4% accuracy"
      >
        GPT-4 + Claude Opus + 민법 RAG
      </TerminalCard>
      <TerminalCard
        tag="03 · SECOND BRAIN"
        title="지식이 쌓입니다"
        footer="// 2,847 notes/user"
      >
        자동 색인, Obsidian 링크, Anki 내보내기
      </TerminalCard>
    </div>
  ),
};
