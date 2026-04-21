import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          surface: "var(--bg-surface)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          "on-accent": "var(--text-on-accent)",
        },
        accent: {
          primary: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
          link: "var(--accent-link)",
        },
        warning: "var(--warning)",
        border: {
          DEFAULT: "var(--border)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
