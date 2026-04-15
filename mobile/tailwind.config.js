/** @type {import('tailwindcss').Config} */
// SSOT mirrors landing-page/tailwind.config.ts — Dark Academia Pro tokens
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        surface: {
          DEFAULT: "#141418",
          low: "#0A0A0B",
          high: "#1C1B1C",
        },
        fg: "#F4F4F5",
        dim: "#71717A",
        violet: {
          DEFAULT: "#A855F7",
          glow: "#DDB7FF",
          deep: "#400071",
        },
        cyan: "#06B6D4",
        amber: "#FBBF24",
        danger: "#EF4444",
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "6px",
        full: "9999px",
      },
      fontFamily: {
        // Web: global.css의 @import로 로드 / Native: 시스템 폰트 fallback
        kr: ['"Pretendard Variable"', "Pretendard", "-apple-system", "sans-serif"],
        en: ["Inter", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "Menlo", "Monaco", "monospace"],
      },
      fontSize: {
        xs: "10px",
        sm: "12px",
        base: "14px",
        lg: "16px",
        xl: "18px",
        "2xl": "22px",
        "3xl": "28px",
        "4xl": "36px",
        "5xl": "48px",
      },
      letterSpacing: {
        tightest: "-0.02em",
      },
    },
  },
  plugins: [],
};
