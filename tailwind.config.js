/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FDFCF8",
        sage: "#E8EFE8",
        lavender: "#EFEDF4",
        coral: "#FFB7B2",
        peach: "#FFE4E1",
        lilac: "#E6E6FA",
        stone: {
          50: "#FAF9F7",
          100: "#F5F4F1",
          200: "#E7E5E0",
          300: "#D6D3CD",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        hand: ["var(--font-reenie)", "cursive"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        ultra: "-0.025em",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "3rem",
        "6xl": "4rem",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(0,0,0,0.05)",
        softer: "0 2px 12px -2px rgba(0,0,0,0.04)",
        lifted: "0 12px 40px -8px rgba(0,0,0,0.08)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        breathe: "breathe 3.4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        breathe: {
          "0%,100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.08)", opacity: "0.92" },
        },
      },
    },
  },
  plugins: [],
};
