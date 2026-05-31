import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EBF4FF",
          100: "#C3D9F7",
          500: "#4A90D9",
          600: "#3A7BC8",
          700: "#2C6BAA",
        },
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#52B788",
          600: "#3A9A6E",
        },
        amber: {
          50: "#FFFBEB",
          500: "#F4A261",
          600: "#E8924A",
        },
        danger: {
          50: "#FFF1F2",
          500: "#E63946",
          600: "#C8303C",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
