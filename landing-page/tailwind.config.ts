import type { Config } from "tailwindcss";

// "The Sovereign Terminal" — Dark Academia Pro design tokens
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base surfaces (tonal layering, not borders)
        bg: "#000000",
        surface: {
          DEFAULT: "#141418",
          low: "#0A0A0B",
          high: "#1C1B1C",
          highest: "#2A2A2B",
        },
        // Semantic
        fg: "#F4F4F5", // off-white (never pure white)
        dim: "#71717A",
        violet: {
          DEFAULT: "#A855F7",
          glow: "#DDB7FF",
          deep: "#400071",
        },
        cyan: "#06B6D4", // citations + mono numbers
        amber: "#FBBF24", // warnings only
        ghost: "rgba(255, 255, 255, 0.1)", // 10% opacity ghost border
      },
      fontFamily: {
        sans: [
          "Inter",
          "Pretendard Variable",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        kr: ["Pretendard Variable", "Pretendard", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "2px",
        md: "6px",
        lg: "6px", // hard cap — no pills
      },
      boxShadow: {
        // Violet glow = signature focus state (replace drop shadows)
        glow: "0 0 0 1px rgba(168, 85, 247, 0.3), 0 0 24px 0 rgba(168, 85, 247, 0.15)",
        "glow-lg":
          "0 0 0 1px rgba(168, 85, 247, 0.4), 0 0 48px 0 rgba(168, 85, 247, 0.25)",
      },
      letterSpacing: {
        tightest: "-0.04em",
        tight: "-0.02em",
      },
      backgroundImage: {
        // 2% scanline overlay — global atmosphere
        scanline:
          "repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 3px)",
      },
    },
  },
  plugins: [],
};

export default config;
