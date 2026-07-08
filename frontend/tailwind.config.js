/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sky: {
          50:   "#E8F4FD",
          100:  "#BBDEFB",
          200:  "#90CAF9",
          400:  "#42A5F5",
          500:  "#2196F3",
          600:  "#1E88E5",
          700:  "#1565C0",
          800:  "#0D47A1",
        },
        // Semantic sentiment colors — purposeful, not decorative
        positive: "#22C55E",
        neutral:  "#2196F3",
        negative: "#EF4444",
        "positive-bg": "#F0FDF4",
        "neutral-bg":  "#EFF6FF",
        "negative-bg": "#FEF2F2",
        "positive-border": "#86EFAC",
        "neutral-border":  "#BFDBFE",
        "negative-border": "#FCA5A5",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        "card": "0 1px 3px rgba(33,150,243,0.08), 0 1px 2px rgba(33,150,243,0.06)",
        "card-hover": "0 4px 12px rgba(33,150,243,0.15)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
