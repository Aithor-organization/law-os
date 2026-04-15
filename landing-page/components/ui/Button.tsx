import { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost" | "mono";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  children: ReactNode;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  // The "Command Unit" — violet glow, no rounded pills
  primary:
    "bg-violet text-black font-mono uppercase tracking-wider hover:shadow-glow-lg transition-shadow",
  // Ghost border at 20% opacity
  ghost:
    "bg-transparent text-fg border border-white/10 hover:border-violet/50 hover:text-violet-glow",
  // Pure mono text action (e.g., `_VIEW_LOGS`)
  mono: "bg-transparent text-violet-glow font-mono uppercase tracking-wide hover:underline",
};

export function Button({
  variant = "primary",
  children,
  icon,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-medium transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
