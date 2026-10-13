import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: "#FAF7F2",   // 最も柔らかい背景
          100: "#F4EFE6",  // サブ背景・カード
          200: "#E8DFD1",  // 枠線
          300: "#D5C7B2",  // 強めの枠線・アイコン
          400: "#B8A389",  // 補助文字
          500: "#8C7355",  // ラテカラー
          600: "#63503B",  // 濃い文字
          700: "#453829",  // 見出し
          800: "#2B2319",  // 最も濃い文字
        },
        sage: {
          light: "#EAF0EC",
          DEFAULT: "#769A85",
          dark: "#517460",
        },
      },
      keyframes: {
        typing: {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
        },
      },
      animation: {
        typing: "typing 1.4s infinite ease-in-out both",
      },
    },
  },
  plugins: [],
};
export default config;
