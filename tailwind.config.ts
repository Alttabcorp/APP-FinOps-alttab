import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0E1F1A",
        canvas: "#E6E8E5",
        panel: "#F3F4F2",
        sheet: "#FFFFFF",
        ink: "#141C19",
        line: "#CDD2CE",
        inflow: "#1B5F4A",
        outflow: "#9C3A28",
        accent: "#2C433B",
        mute: "#5E6A65",
        surplus: "#1B5F4A",
        short: "#9C3A28",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
