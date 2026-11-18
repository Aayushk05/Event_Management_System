/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#09090f",
          card: "#111118",
          elevated: "#17171f",
          border: "#1e1e2e",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(245, 158, 11, 0.15)",
        "glow-cyan": "0 0 20px rgba(6, 182, 212, 0.15)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
