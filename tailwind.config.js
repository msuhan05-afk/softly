/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7EF",
        parchment: "#F4EDDF",
        honey: {
          50: "#FDF6E7",
          100: "#FAE9C6",
          200: "#F5D68E",
          300: "#EFBE55",
          400: "#E8A82B",
          500: "#D99A34",
          600: "#C98A2B",
          700: "#A96F1E",
          800: "#8A5A1E",
          900: "#5F3D12",
        },
        charcoal: {
          DEFAULT: "#241C12",
          soft: "#3A3023",
          mute: "#6B5F4C",
        },
        forest: {
          DEFAULT: "#5C6B45",
          light: "#7A8B5E",
          pale: "#EEF1E6",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        ultra: "-0.025em",
        wider2: "0.18em",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "3rem",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(36,28,18,0.07)",
        lifted: "0 16px 48px -12px rgba(36,28,18,0.16)",
        jar: "0 24px 60px -18px rgba(169,111,30,0.35)",
      },
      animation: {
        drip: "drip 5s ease-in-out infinite",
        floaty: "floaty 7s ease-in-out infinite",
      },
      keyframes: {
        drip: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(8px)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
