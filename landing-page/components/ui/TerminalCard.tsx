import { ReactNode } from "react";

interface TerminalCardProps {
  tag: string; // e.g., "01 · KEYBOARD FIRST"
  title: string;
  children: ReactNode;
  footer?: string; // mono footer line, e.g., "// 847k uses this month"
}

// The "Folio" card — surface #141418, 6px radius, hover violet glow.
// No dividers — only vertical rhythm separates content.
export function TerminalCard({ tag, title, children, footer }: TerminalCardProps) {
  return (
    <div className="group rounded-md bg-surface p-8 transition-all hover:shadow-glow">
      <div className="font-mono text-xs uppercase tracking-wider text-violet-glow">
        {tag}
      </div>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-fg">
        {title}
      </h3>
      <div className="mt-4 font-kr text-sm leading-relaxed text-dim">
        {children}
      </div>
      {footer ? (
        <div className="mt-8 font-mono text-xs text-dim">{footer}</div>
      ) : null}
    </div>
  );
}
